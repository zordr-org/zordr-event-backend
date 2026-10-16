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

  async syncAuthUser(authUser: AuthUser) {
    const rawId = authUser.id ?? authUser.sub;

    if (typeof rawId !== 'string' || !rawId.trim()) {
      throw new UnauthorizedException('Missing authenticated user ID');
    }

    const id = rawId.trim();
    const name =
      typeof authUser.name === 'string' && authUser.name.trim()
        ? authUser.name.trim()
        : undefined;
    const email =
      typeof authUser.email === 'string' && authUser.email.trim()
        ? authUser.email.trim().toLowerCase()
        : undefined;
    const avatar =
      typeof authUser.image === 'string' && authUser.image.trim()
        ? authUser.image.trim()
        : undefined;

    return this.prisma.user.upsert({
  where: { id },
  create: {
    id,
    name: name ?? '',
    domain_email: email ?? '',
    avatar: avatar ?? null,
    phone: '',
    college: '',
    branch: '',
    year: 0,
  },
  update: {
    ...(name !== undefined ? { name } : {}),
    ...(email !== undefined ? { domain_email: email } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
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