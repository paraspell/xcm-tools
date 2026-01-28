import { ConfigService } from '@nestjs/config';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from './prisma.service.js';

vi.mock('@prisma/adapter-pg');

vi.mock('../generated/prisma/client.js', () => ({
  PrismaClient: vi.fn(class {}),
}));

describe('PrismaService', () => {
  let service: PrismaService;
  const mockDatabaseUrl = 'postgres://test-url';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'DATABASE_URL') return mockDatabaseUrl;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
