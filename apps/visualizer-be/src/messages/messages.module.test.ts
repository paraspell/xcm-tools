import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { MessageResolver } from './messages.resolver.js';
import { MessageService } from './messages.service.js';

describe('MessageModule', () => {
  let module: TestingModule;
  let messageService: MessageService;
  let messageResolver: MessageResolver;

  let prisma: {
    $queryRawUnsafe: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    prisma = {
      $queryRawUnsafe: vi.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        MessageService,
        MessageResolver,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    messageService = module.get<MessageService>(MessageService);
    messageResolver = module.get<MessageResolver>(MessageResolver);
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide MessageService', () => {
    expect(messageService).toBeDefined();
  });

  it('should provide MessageResolver', () => {
    expect(messageResolver).toBeDefined();
  });
});
