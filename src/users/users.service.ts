import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type AuthUser = {
  id?: unknown;
  sub?: unknown;
  name?: unknown;
  email?: unknown;
  image?: unknown;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  
async syncAuthUser(authUser: {
  id?: unknown;
  sub?: unknown;
  name?: unknown;
  email?: unknown;
  image?: unknown;
}) {
  const rawId = authUser.id ?? authUser.sub;

  if (typeof rawId !== 'string' || !rawId.trim()) {
    throw new Error('Missing Neon Auth user ID');
  }

  if (typeof authUser.email !== 'string' || !authUser.email.trim()) {
    throw new Error('Missing Neon Auth user email');
  }

  const id = rawId.trim();
  const email = authUser.email.trim().toLowerCase();

  const name =
    typeof authUser.name === 'string' && authUser.name.trim()
      ? authUser.name.trim()
      : '';

  const avatarUrl =
    typeof authUser.image === 'string' && authUser.image.trim()
      ? authUser.image.trim()
      : null;

  return this.prisma.user.upsert({
    where: { id },
    create: {
      id,
      name,
      domain_email: email,
      avatarUrl,
      phone: '',
      college: '',
      branch: '',
      year: 0,
    },
    update: {
      name,
      domain_email: email,
      avatarUrl,
    },
  });
}


  async findOrSyncFromClaims(claims: Record<string, unknown>) {
    return this.syncAuthUser({
      id: claims.sub,
      name: claims.name,
      email: claims.email,
      image: claims.image,
    });
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
      isOrganizer: Boolean(user.organizer),
    };
  }
}