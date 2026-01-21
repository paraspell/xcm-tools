import { Injectable } from '@nestjs/common';

import { user } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(): Promise<user> {
    return this.prisma.user.create({ data: {} });
  }

  findOne(userId: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
