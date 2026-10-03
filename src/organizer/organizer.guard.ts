import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrganizerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
    });

    if (!organizer) {
      throw new ForbiddenException('This account has no organizer profile');
    }

    request.organizer = organizer;
    return true;
  }
}