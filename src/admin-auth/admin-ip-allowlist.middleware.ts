import { ForbiddenException, Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminIpAllowlistMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AdminIpAllowlist');
  private readonly allowlist: string[] | null;

  constructor() {
    const raw = process.env.ADMIN_IP_ALLOWLIST;
    this.allowlist = raw ? raw.split(',').map((ip) => ip.trim()) : null;

    if (!this.allowlist && process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_IP_ALLOWLIST must be set in production');
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.allowlist) {
      this.logger.warn(`No ADMIN_IP_ALLOWLIST configured — allowing ${req.ip} (dev mode only)`);
      return next();
    }

    if (!req.ip || !this.allowlist.includes(req.ip)) {
      this.logger.warn(`Blocked admin request from disallowed IP: ${req.ip ?? 'unknown'}`);
      throw new ForbiddenException('Access denied from this network');
    }

    next();
  }
}