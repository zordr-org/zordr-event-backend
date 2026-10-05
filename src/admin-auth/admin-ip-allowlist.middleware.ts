import { ForbiddenException, Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminIpAllowlistMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AdminAccessControl');
  private readonly allowlist: string[] | null;
  private readonly accessKey: string | null;

  constructor() {
    const rawIps = process.env.ADMIN_IP_ALLOWLIST;
    this.allowlist = rawIps && rawIps !== '*' ? rawIps.split(',').map((ip) => ip.trim()) : null;

    this.accessKey = process.env.ADMIN_ACCESS_KEY ?? null;

    const hasAnyProtection = this.allowlist !== null || this.accessKey !== null;
    if (!hasAnyProtection && process.env.NODE_ENV === 'production') {
      throw new Error(
        'Set ADMIN_IP_ALLOWLIST or ADMIN_ACCESS_KEY in production (or ADMIN_IP_ALLOWLIST=* to explicitly disable this layer)',
      );
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (this.allowlist) {
      if (req.ip && this.allowlist.includes(req.ip)) {
        return next();
      }
      this.logger.warn(`Blocked admin request from disallowed IP: ${req.ip ?? 'unknown'}`);
      throw new ForbiddenException('Access denied from this network');
    }

    if (this.accessKey) {
      const providedKey = req.headers['x-admin-access-key'];
      if (providedKey === this.accessKey) {
        return next();
      }
      this.logger.warn('Blocked admin request missing or invalid access key');
      throw new ForbiddenException('Access denied');
    }

    this.logger.warn(`No admin access control configured — allowing ${req.ip} (explicit dev/test bypass)`);
    next();
  }
}