import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service.js';
import { type Repository } from 'typeorm';
import { type User } from './user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;

  beforeEach(() => {
    usersRepository = {
      save: vi.fn(),
      findOneBy: vi.fn(),
    } as unknown as Repository<User>;

    service = new UsersService(usersRepository);
  });

  describe('create', () => {
    it('should call usersRepository.save with an empty object and return the result', async () => {
      const mockUser = { id: '1', name: 'Test User', requestLimit: 1 } as User;

      const spy = vi.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.create();

      expect(spy).toHaveBeenCalledWith({});
      expect(result).toBe(mockUser);
    });
  });

  describe('findOne', () => {
    it('should call usersRepository.findOneBy with the correct userId and return the result', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        name: 'Test User',
        requestLimit: 1,
      } as User;

      const spy = vi
        .spyOn(usersRepository, 'findOneBy')
        .mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(spy).toHaveBeenCalledWith({ id: userId });
      expect(result).toBe(mockUser);
    });

    it('should return null if no user is found', async () => {
      const userId = '1';

      const spy = vi
        .spyOn(usersRepository, 'findOneBy')
        .mockResolvedValue(null);

      const result = await service.findOne(userId);

      expect(spy).toHaveBeenCalledWith({ id: userId });
      expect(result).toBeNull();
    });
  });
});
