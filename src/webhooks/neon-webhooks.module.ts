import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { NeonWebhookVerifier } from './neon-webhook-verifier.js';
import { NeonWebhooksController } from './neon-webhooks.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [NeonWebhooksController],
  providers: [NeonWebhookVerifier],
})
export class NeonWebhooksModule {}