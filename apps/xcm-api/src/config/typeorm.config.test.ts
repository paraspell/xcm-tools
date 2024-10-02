import { describe, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config.js';
import { User } from '../users/user.entity.js';

describe('typeOrmConfig', () => {
  const mockConfigService = {
    get: vi.fn(),
  } as unknown as ConfigService;

  it('should return correct TypeOrmModuleOptions with the provided configuration', () => {
    const spy = vi
      .spyOn(mockConfigService, 'get')
      .mockImplementation((key: string) => {
        switch (key) {
          case 'DB_HOST':
            return 'localhost';
          case 'DB_PORT':
            return 5432;
          case 'DB_USER':
            return 'testuser';
          case 'DB_PASS':
            return 'testpassword';
          case 'DB_NAME':
            return 'testdb';
          default:
            return null;
        }
      });

    const result: TypeOrmModuleOptions = typeOrmConfig(mockConfigService);

    expect(result).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpassword',
      database: 'testdb',
      entities: [User],
      synchronize: true,
    });

    expect(spy).toHaveBeenCalledWith('DB_HOST');
    expect(spy).toHaveBeenCalledWith('DB_PORT');
    expect(spy).toHaveBeenCalledWith('DB_USER');
    expect(spy).toHaveBeenCalledWith('DB_PASS');
    expect(spy).toHaveBeenCalledWith('DB_NAME');
  });
});
