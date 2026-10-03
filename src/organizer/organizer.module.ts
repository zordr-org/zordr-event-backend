import { Module } from '@nestjs/common';
import { OrganizerService } from './organizer.service.js';
import { OrganizerController } from './organizer.controller.js';
import { OrganizerGuard } from './organizer.guard.js';
import { UsersModule } from '../users/users.module.js';
import { NeonAuthGuard } from '../auth/neon-auth.guard.js';


@Module({
  imports: [UsersModule],
  providers: [OrganizerService, OrganizerGuard, NeonAuthGuard],
  controllers: [OrganizerController],
  exports: [OrganizerGuard],
})
export class OrganizerModule {}