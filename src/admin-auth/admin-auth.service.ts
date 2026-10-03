import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { generate, generateSecret, generateURI, verify } from 'otplib';
import { PrismaService } from '../prisma/prisma.service.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 7;
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q3RvS8H1i4Q6MnJqXhIfHF6z8O6Zm';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private async audit(actorId: string, action: string) {
    await this.prisma.auditLog.create({
      data: { actorId, action, entityType: 'AdminEmployee', entityId: actorId },
    });
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueTokenPair(adminId: string, role: string) {
    const accessToken = this.jwt.sign({ sub: adminId, role }, { expiresIn: ACCESS_TOKEN_TTL });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { adminId, tokenHash: this.hashToken(refreshToken), expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const admin = await this.prisma.adminEmployee.findUnique({ where: { email } });

    if (!admin) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      throw new UnauthorizedException('Account temporarily locked due to failed login attempts');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordMatches) {
      const failedCount = admin.failedLoginCount + 1;
      const lockedUntil =
        failedCount >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null;

      await this.prisma.adminEmployee.update({
        where: { id: admin.id },
        data: { failedLoginCount: failedCount, lockedUntil },
      });

      await this.audit(admin.id, 'ADMIN_LOGIN_FAILED');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.adminEmployee.update({
      where: { id: admin.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    if (admin.twoFactorEnabled) {
      const tempToken = this.jwt.sign(
        { sub: admin.id, purpose: '2fa-pending' },
        { expiresIn: '5m' },
      );
      return { requiresTwoFactor: true, tempToken };
    }

    await this.audit(admin.id, 'ADMIN_LOGIN_SUCCESS');
    const tokens = await this.issueTokenPair(admin.id, admin.role);
    return { requiresTwoFactor: false, ...tokens };
  }

  async verifyTwoFactor(tempToken: string, code: string) {
    let payload;
    try {
      payload = this.jwt.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (payload.purpose !== '2fa-pending') {
      throw new UnauthorizedException('Invalid session');
    }

    const admin = await this.prisma.adminEmployee.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.twoFactorSecret) {
      throw new UnauthorizedException('Invalid session');
    }

    const result = await verify({ secret: admin.twoFactorSecret, token: code });
    if (!result.valid) {
      await this.audit(admin.id, 'ADMIN_2FA_FAILED');
      throw new UnauthorizedException('Invalid code');
    }

    await this.audit(admin.id, 'ADMIN_LOGIN_SUCCESS');
    return this.issueTokenPair(admin.id, admin.role);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || new Date(stored.expiresAt) < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const admin = await this.prisma.adminEmployee.findUnique({
      where: { id: stored.adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Account no longer exists');
    }

    return this.issueTokenPair(admin.id, admin.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }

  async setupTwoFactor(adminId: string) {
    const secret = generateSecret();
    await this.prisma.adminEmployee.update({
      where: { id: adminId },
      data: { twoFactorSecret: secret },
    });

    const admin = await this.prisma.adminEmployee.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const otpauthUrl = generateURI({ issuer: 'Zordr Admin', label: admin.email, secret });
    return { secret, otpauthUrl };
  }

  async enableTwoFactor(adminId: string, code: string) {
    const admin = await this.prisma.adminEmployee.findUnique({ where: { id: adminId } });
    if (!admin || !admin.twoFactorSecret) {
      throw new NotFoundException('Admin not found or 2FA not set up');
    }

    const result = await verify({ secret: admin.twoFactorSecret, token: code });
    if (!result.valid) throw new UnauthorizedException('Invalid code');

    await this.prisma.adminEmployee.update({
      where: { id: adminId },
      data: { twoFactorEnabled: true },
    });

    await this.audit(adminId, 'ADMIN_2FA_ENABLED');
    return { enabled: true };
  }
}