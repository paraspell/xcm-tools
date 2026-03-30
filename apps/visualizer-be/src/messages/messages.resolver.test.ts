import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CountOption } from '../types.js';
import { MessageResolver } from './messages.resolver.js';
import { MessageService } from './messages.service.js';

describe('MessageResolver', () => {
  let resolver: MessageResolver;
  let module: TestingModule;
  let service: {
    countMessagesByStatus: ReturnType<typeof vi.fn>;
    countMessagesByDay: ReturnType<typeof vi.fn>;
    countAssetsBySymbol: ReturnType<typeof vi.fn>;
    getAccountXcmCounts: ReturnType<typeof vi.fn>;
    getTotalMessageCounts: ReturnType<typeof vi.fn>;
  };

  const ecosystem = 'polkadot';
  const parachains = ['Acala', 'Moonbeam'];
  const startTime = new Date('2025-01-01T00:00:00Z');
  const endTime = new Date('2025-01-02T00:00:00Z');

  beforeEach(async () => {
    service = {
      countMessagesByStatus: vi.fn(),
      countMessagesByDay: vi.fn(),
      countAssetsBySymbol: vi.fn(),
      getAccountXcmCounts: vi.fn(),
      getTotalMessageCounts: vi.fn(),
    };

    module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        MessageResolver,
        {
          provide: MessageService,
          useValue: service,
        },
      ],
    }).compile();

    await module.init();
    resolver = module.get(MessageResolver);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('messageCounts', () => {
    it('should call countMessagesByStatus with correct args', async () => {
      const expected = [{ status: 'success', paraId: 1000, count: 5 }];
      service.countMessagesByStatus.mockResolvedValue(expected);

      const result = await resolver.messageCounts(
        ecosystem,
        parachains,
        startTime,
        endTime,
      );

      expect(result).toEqual(expected);
      expect(service.countMessagesByStatus).toHaveBeenCalledWith(
        ecosystem,
        parachains,
        startTime.getTime(),
        endTime.getTime(),
      );
    });
  });

  describe('messageCountsByDay', () => {
    it('should call countMessagesByDay with correct args', async () => {
      const expected = [{ date: '2025-01-01', paraId: 1000, count: 3 }];
      service.countMessagesByDay.mockResolvedValue(expected);

      const result = await resolver.messageCountsByDay(
        ecosystem,
        parachains,
        startTime,
        endTime,
      );

      expect(result).toEqual(expected);
      expect(service.countMessagesByDay).toHaveBeenCalledWith(
        ecosystem,
        parachains,
        startTime.getTime(),
        endTime.getTime(),
      );
    });
  });

  describe('assetCountsBySymbol', () => {
    it('should call countAssetsBySymbol with correct args', async () => {
      const expected = [{ symbol: 'DOT', count: 10 }];
      service.countAssetsBySymbol.mockResolvedValue(expected);

      const result = await resolver.assetCountsBySymbol(
        ecosystem,
        parachains,
        startTime,
        endTime,
      );

      expect(result).toEqual(expected);
      expect(service.countAssetsBySymbol).toHaveBeenCalledWith(
        ecosystem,
        parachains,
        startTime.getTime(),
        endTime.getTime(),
      );
    });
  });

  describe('accountCounts', () => {
    it('should call getAccountXcmCounts with correct args', async () => {
      const expected = [{ account: '0x123', count: 7 }];
      const paraIds = [1000, 2000];
      const threshold = 5;
      service.getAccountXcmCounts.mockResolvedValue(expected);

      const result = await resolver.accountCounts(
        ecosystem,
        threshold,
        paraIds,
        startTime,
        endTime,
      );

      expect(result).toEqual(expected);
      expect(service.getAccountXcmCounts).toHaveBeenCalledWith(
        ecosystem,
        paraIds,
        threshold,
        startTime.getTime(),
        endTime.getTime(),
      );
    });
  });

  describe('totalMessageCounts', () => {
    it('should call getTotalMessageCounts with correct args', async () => {
      const expected = [{ paraId: 1000, count: 20 }];
      service.getTotalMessageCounts.mockResolvedValue(expected);

      const result = await resolver.totalMessageCounts(
        ecosystem,
        startTime,
        endTime,
        CountOption.ORIGIN,
      );

      expect(result).toEqual(expected);
      expect(service.getTotalMessageCounts).toHaveBeenCalledWith(
        ecosystem,
        startTime.getTime(),
        endTime.getTime(),
        CountOption.ORIGIN,
      );
    });
  });
});
