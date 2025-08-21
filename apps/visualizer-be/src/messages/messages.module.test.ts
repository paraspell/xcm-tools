import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Message } from './message.entity';
import { MessageResolver } from './messages.resolver';
import { MessageService } from './messages.service';

describe('MessageModule', () => {
  let module: TestingModule;
  let messageService: MessageService;
  let messageResolver: MessageResolver;

  beforeAll(async () => {
    const mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        MessageService,
        MessageResolver,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
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
