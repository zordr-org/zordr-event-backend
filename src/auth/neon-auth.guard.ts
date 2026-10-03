import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { UsersService } from '../users/users.service.js';

const jwks = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

@Injectable()
export class NeonAuthGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);

    let payload;
    try {
      const result = await jwtVerify(token, jwks);
      payload = result.payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findOrSyncFromClaims(payload);
    request.user = user;
    return true;
  }
}