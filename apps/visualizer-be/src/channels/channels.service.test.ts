import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Channel } from './channel.entity.js';
import { ChannelService } from './channels.service.js';

describe('ChannelService', () => {
  let service: ChannelService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      query: vi.fn(),
    } as unknown as Repository<Channel>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: getRepositoryToken(Channel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
  });

  describe('findAll', () => {
    const ecosystem = 'polkadot';

    it('should return an array of channels on successful fetch', async () => {
      const expectedResponse = [
        {
          id: 1,
          ecosystem: 'polkadot',
          senderId: 101,
          recipientId: 201,
          totalCount: 5,
          transferCount: 6,
        },
        {
          id: 2,
          ecosystem: 'polkadot',
          senderId: 102,
          recipientId: 202,
          totalCount: 3,
          transferCount: 9,
        },
      ];

      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockResolvedValue(expectedResponse);

      const result = await service.findAll(ecosystem);

      expect(result).toEqual(
        expectedResponse.map((channel) => ({
          id: channel.id,
          ecosystem: channel.ecosystem,
          sender: channel.senderId,
          recipient: channel.recipientId,
          message_count: channel.totalCount,
          transfer_count: channel.transferCount,
        })),
      );
      expect(querySpy).toHaveBeenCalledWith(expect.any(String), [ecosystem]);
    });

    it('should return an empty array when no channels are found', async () => {
      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockResolvedValue([]);

      const result = await service.findAll(ecosystem);

      expect(result).toEqual([]);
      expect(querySpy).toHaveBeenCalled();
    });

    it('should throw an error when the query execution fails', async () => {
      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockRejectedValue(new Error('Query execution failed'));

      await expect(service.findAll(ecosystem)).rejects.toThrow(
        'Query execution failed',
      );
    });
  });

  describe('findAllWithinInterval', () => {
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;

    it('should return an array of channels on successful fetch', async () => {
      const expectedResponse = [
        {
          id: 1,
          ecosystem: 'polkadot',
          senderId: 101,
          recipientId: 201,
          totalCount: 5,
        },
        {
          id: 2,
          ecosystem: 'polkadot',
          senderId: 102,
          recipientId: 202,
          totalCount: 3,
        },
      ];

      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockResolvedValue(expectedResponse);

      const result = await service.findAllInInterval(
        ecosystem,
        startTime,
        endTime,
      );

      expect(result).toEqual(
        expectedResponse.map((channel) => ({
          id: channel.id,
          ecosystem: channel.ecosystem,
          sender: channel.senderId,
          recipient: channel.recipientId,
          message_count: channel.totalCount,
        })),
      );
      expect(querySpy).toHaveBeenCalledWith(expect.any(String), [
        ecosystem,
        startTime,
        endTime,
      ]);
    });

    it('should return an empty array when no channels are found', async () => {
      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockResolvedValue([]);

      const result = await service.findAllInInterval(
        ecosystem,
        startTime,
        endTime,
      );

      expect(result).toEqual([]);
      expect(querySpy).toHaveBeenCalled();
    });

    it('should throw an error when the query execution fails', async () => {
      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockRejectedValue(new Error('Query execution failed'));

      await expect(
        service.findAllInInterval(ecosystem, startTime, endTime),
      ).rejects.toThrow('Query execution failed');
    });
  });

  describe('findOne', () => {
    const channelId = 1;

    it('should return a channel when it exists', async () => {
      const expectedResponse = [
        {
          id: channelId,
          ecosystem: 'polkadot',
          senderId: 101,
          recipientId: 201,
          totalCount: 5,
          status: 'accepted',
        },
      ];

      const querySpy = vi.spyOn(mockRepository, 'query');
      querySpy.mockResolvedValue(expectedResponse);

      const result = await service.findOne('polkadot', 2000, 2006);

      expect(result).toEqual({
        id: channelId,
        ecosystem: 'polkadot',
        sender: expectedResponse[0].senderId,
        recipient: expectedResponse[0].recipientId,
        active_at: NaN,
        message_count: expectedResponse[0].totalCount,
        status: expectedResponse[0].status,
      });
      expect(querySpy).toHaveBeenCalledWith(expect.any(String), [
        'polkadot',
        2000,
        2006,
      ]);
    });

    it('should throw an error when no channel is found', async () => {
      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockResolvedValue([]);

      await expect(service.findOne('polkadot', 2000, 1987)).rejects.toThrow(
        `No channel found with sender ID ${2000} or recipient ID ${1987} in ecosystem ${'polkadot'}.`,
      );
    });

    it('should throw an error when the query execution fails', async () => {
      const querySpy = vi.spyOn(mockRepository, 'query');

      querySpy.mockRejectedValue(new Error('Query execution failed'));

      await expect(service.findOne('polkadot', 2000, 2006)).rejects.toThrow(
        'Query execution failed',
      );
    });
  });
});
