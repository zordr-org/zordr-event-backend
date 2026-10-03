import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizerDto } from './create-organizer.dto.js';

@Injectable()
export class OrganizerService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateOrganizerDto) {
    const existing = await this.prisma.organizer.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('This account already has an organizer profile');
    }

    return this.prisma.organizer.create({
      data: { userId, ...dto },
    });
  }
}