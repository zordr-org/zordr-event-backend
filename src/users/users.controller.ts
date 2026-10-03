import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NeonAuthGuard } from '../auth/neon-auth.guard.js';
import { UsersService } from './users.service.js';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(NeonAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }
}