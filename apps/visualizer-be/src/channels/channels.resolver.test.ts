import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChannelResolver } from './channels.resolver.js';
import { ChannelService } from './channels.service.js';

describe('ChannelResolver', () => {
  let resolver: ChannelResolver;
  let module: TestingModule;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findAllInInterval: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      findAll: vi.fn(),
      findAllInInterval: vi.fn(),
      findOne: vi.fn(),
    };

    module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        ChannelResolver,
        {
          provide: ChannelService,
          useValue: service,
        },
      ],
    }).compile();

    await module.init();
    resolver = module.get(ChannelResolver);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should call channelService.findAll with ecosystem', () => {
      const channels = [{ id: 1, ecosystem: 'polkadot' }];
      service.findAll.mockReturnValue(channels);

      const result = resolver.findAll('polkadot');

      expect(result).toEqual(channels);
      expect(service.findAll).toHaveBeenCalledWith('polkadot');
    });
  });

  describe('findAllInterval', () => {
    it('should call channelService.findAllInInterval with ecosystem and timestamps', () => {
      const channels = [{ id: 1, ecosystem: 'polkadot' }];
      service.findAllInInterval.mockReturnValue(channels);

      const startTime = new Date('2025-01-01T00:00:00Z');
      const endTime = new Date('2025-01-02T00:00:00Z');

      const result = resolver.findAllInterval('polkadot', startTime, endTime);

      expect(result).toEqual(channels);
      expect(service.findAllInInterval).toHaveBeenCalledWith(
        'polkadot',
        startTime.getTime(),
        endTime.getTime(),
      );
    });
  });

  describe('findOne', () => {
    it('should call channelService.findOne with ecosystem, sender, and recipient', () => {
      const channel = {
        id: 1,
        ecosystem: 'polkadot',
        sender: 1000,
        recipient: 2000,
      };
      service.findOne.mockReturnValue(channel);

      const result = resolver.findOne('polkadot', 1000, 2000);

      expect(result).toEqual(channel);
      expect(service.findOne).toHaveBeenCalledWith('polkadot', 1000, 2000);
    });
  });
});
