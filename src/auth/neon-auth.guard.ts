import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { UsersService } from '../users/users.service.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const url = process.env.NEON_AUTH_JWKS_URL;
    if (!url) {
      throw new InternalServerErrorException('NEON_AUTH_JWKS_URL is not configured');
    }
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

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
      const result = await jwtVerify(token, getJwks());
      payload = result.payload;
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findOrSyncFromClaims(payload);
    request.user = user;
    return true;
  }
}