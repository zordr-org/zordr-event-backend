import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminJwtGuard } from './admin-jwt.guard.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [AdminAuthService, AdminJwtGuard],
  controllers: [AdminAuthController],
  exports: [AdminJwtGuard],
})
export class AdminAuthModule {}