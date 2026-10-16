import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../users/users.service.js';
import { NeonWebhookVerifier } from './neon-webhook-verifier.js';

@Controller('webhooks')
export class NeonWebhooksController {
  constructor(
    private readonly verifier: NeonWebhookVerifier,
    private readonly usersService: UsersService,
  ) {}

  @Post('neon-auth')
  @HttpCode(HttpStatus.OK)
  async receive(@Req() req: RawBodyRequest<Request>) {
    const payload = await this.verifier.verifyAndParse(
      req.rawBody,
      req.headers,
    );

    if (payload?.event_type !== 'user.created') {
      return { received: true, processed: false };
    }

    if (!payload.user || typeof payload.user !== 'object') {
      return { received: true, processed: false };
    }

    await this.usersService.syncAuthUser(payload.user);

    return {
      received: true,
      processed: true,
    };
  }
}