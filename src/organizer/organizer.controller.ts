import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { NeonAuthGuard } from '../auth/neon-auth.guard.js';
import { OrganizerService } from './organizer.service.js';
import { CreateOrganizerDto } from './create-organizer.dto.js';

@Controller('organizer')
export class OrganizerController {
  constructor(private organizerService: OrganizerService) {}

  @UseGuards(NeonAuthGuard)
  @Post('profile')
  async create(@Req() req: any, @Body() dto: CreateOrganizerDto) {
    return this.organizerService.createProfile(req.user.id, dto);
  }
}