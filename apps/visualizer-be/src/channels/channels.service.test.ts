import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { ChannelService } from './channels.service.js';

describe('ChannelService', () => {
  let service: ChannelService;
  let prisma: {
    $queryRawUnsafe: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      $queryRawUnsafe: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(ChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const ecosystem = 'polkadot';

    it('should return an array of channels', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        {
          id: '1',
          ecosystem,
          senderId: '101',
          recipientId: '201',
          transferCount: '6',
          totalCount: '5',
        },
        {
          id: '2',
          ecosystem,
          senderId: '102',
          recipientId: '202',
          transferCount: '9',
          totalCount: '3',
        },
      ]);

      const result = await service.findAll(ecosystem);

      expect(result).toEqual([
        {
          id: 1,
          ecosystem,
          sender: 101,
          recipient: 201,
          transfer_count: 6,
          message_count: 5,
          status: 'accepted',
        },
        {
          id: 2,
          ecosystem,
          sender: 102,
          recipient: 202,
          transfer_count: 9,
          message_count: 3,
          status: 'accepted',
        },
      ]);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledOnce();
    });

    it('should return an empty array when no channels are found', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([]);

      const result = await service.findAll(ecosystem);

      expect(result).toEqual([]);
    });

    it('should propagate query errors', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(
        new Error('Query execution failed'),
      );

      await expect(service.findAll(ecosystem)).rejects.toThrow(
        'Query execution failed',
      );
    });
  });

  describe('findAllInInterval', () => {
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;

    it('should return channels within interval', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        {
          id: '1',
          ecosystem,
          senderId: '101',
          recipientId: '201',
          totalCount: '5',
        },
        {
          id: '2',
          ecosystem,
          senderId: '102',
          recipientId: '202',
          totalCount: '3',
        },
      ]);

      const result = await service.findAllInInterval(
        ecosystem,
        startTime,
        endTime,
      );

      expect(result).toEqual([
        {
          id: 1,
          ecosystem,
          sender: 101,
          recipient: 201,
          message_count: 5,
        },
        {
          id: 2,
          ecosystem,
          sender: 102,
          recipient: 202,
          message_count: 3,
        },
      ]);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledOnce();
    });

    it('should return empty array if no results', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([]);

      const result = await service.findAllInInterval(
        ecosystem,
        startTime,
        endTime,
      );

      expect(result).toEqual([]);
    });

    it('should propagate query errors', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(
        new Error('Query execution failed'),
      );

      await expect(
        service.findAllInInterval(ecosystem, startTime, endTime),
      ).rejects.toThrow('Query execution failed');
    });
  });

  describe('findOne', () => {
    const ecosystem = 'polkadot';
    const sender = 2000;
    const recipient = 2006;

    it('should return a channel when found', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        {
          id: '1',
          senderId: '101',
          recipientId: '201',
          totalCount: '5',
          active_at: '123456',
          status: 'accepted',
        },
      ]);

      const result = await service.findOne(ecosystem, sender, recipient);

      expect(result).toEqual({
        id: 1,
        ecosystem,
        sender: 101,
        recipient: 201,
        message_count: 5,
        active_at: 123456,
        status: 'accepted',
      });
    });

    it('should throw when no channel is found', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([]);

      await expect(
        service.findOne(ecosystem, sender, recipient),
      ).rejects.toThrow(
        `No channel found with sender ${sender}, recipient ${recipient}, ecosystem ${ecosystem}`,
      );
    });

    it('should propagate query errors', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(
        new Error('Query execution failed'),
      );

      await expect(
        service.findOne(ecosystem, sender, recipient),
      ).rejects.toThrow('Query execution failed');
    });
  });
});
