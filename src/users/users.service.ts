import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrSyncFromClaims(claims: Record<string, unknown>) {
    const id = claims.sub as string;

    try {
      return await this.prisma.user.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name: (claims.name as string) ?? '',
          domain_email: (claims.email as string) ?? '',
          phone: '',
          college: '',
          branch: '',
          year: 0,
        },
      });
    } catch {
      return this.prisma.user.findUniqueOrThrow({ where: { id } });
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organizer: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.domain_email,
      isOrganizer: !!user.organizer,
    };
  }
}