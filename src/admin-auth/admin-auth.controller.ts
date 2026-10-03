import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminLoginDto, AdminVerifyTwoFactorDto, AdminEnableTwoFactorDto, RefreshTokenDto } from './dto.js';
import { AdminJwtGuard } from './admin-jwt.guard.js';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.email, dto.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('2fa/verify')
  async verifyTwoFactor(@Body() dto: AdminVerifyTwoFactorDto) {
    return this.adminAuthService.verifyTwoFactor(dto.tempToken, dto.code);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.adminAuthService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    return this.adminAuthService.logout(dto.refreshToken);
  }

  @UseGuards(AdminJwtGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@Req() req: any) {
    return this.adminAuthService.setupTwoFactor(req.admin.id);
  }

  @UseGuards(AdminJwtGuard)
  @Post('2fa/enable')
  async enableTwoFactor(@Req() req: any, @Body() dto: AdminEnableTwoFactorDto) {
    return this.adminAuthService.enableTwoFactor(req.admin.id, dto.code);
  }
}