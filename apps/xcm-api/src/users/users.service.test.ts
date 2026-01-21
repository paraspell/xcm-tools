import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { user } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new UsersService(prismaService);
  });

  describe('create', () => {
    it('should call prisma.user.create with the provided data and return the result', async () => {
      const mockUser: user = {
        id: '1',
        requestLimit: 100,
      };

      const spy = vi
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockUser);

      const result = await service.create();

      expect(spy).toHaveBeenCalledWith({ data: {} });
      expect(result).toBe(mockUser);
    });
  });

  describe('findOne', () => {
    it('should call prisma.user.findUnique with the correct userId and return the result', async () => {
      const userId = '1';

      const mockUser: user = {
        id: userId,
        requestLimit: 100,
      };

      const spy = vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(spy).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toBe(mockUser);
    });

    it('should return null if no user is found', async () => {
      const userId = '1';

      const spy = vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null);

      const result = await service.findOne(userId);

      expect(spy).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toBeNull();
    });
  });
});
