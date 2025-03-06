import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Channel } from './channel.entity';
import { ChannelService } from './channels.service';

describe('ChannelService', () => {
  let service: ChannelService;
  let mockRepository: Partial<Record<keyof Repository<Channel>, jest.Mock>>;

  beforeEach(async () => {
    mockRepository = {
      query: jest.fn(),
    };

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
    const startTime = 1633046400;
    const endTime = 1633132800;

    it('should return an array of channels on successful fetch', async () => {
      const expectedResponse = [
        { id: 1, senderId: 101, recipientId: 201, totalCount: 5 },
        { id: 2, senderId: 102, recipientId: 202, totalCount: 3 },
      ];

      mockRepository.query.mockResolvedValue(expectedResponse);

      const result = await service.findAll(startTime, endTime);

      expect(result).toEqual(
        expectedResponse.map((channel) => ({
          id: channel.id,
          sender: channel.senderId,
          recipient: channel.recipientId,
          message_count: channel.totalCount,
        })),
      );
      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        startTime,
        endTime,
      ]);
    });

    it('should return an empty array when no channels are found', async () => {
      mockRepository.query.mockResolvedValue([]);

      const result = await service.findAll(startTime, endTime);

      expect(result).toEqual([]);
      expect(mockRepository.query).toHaveBeenCalled();
    });

    it('should throw an error when the query execution fails', async () => {
      mockRepository.query.mockRejectedValue(
        new Error('Query execution failed'),
      );

      await expect(service.findAll(startTime, endTime)).rejects.toThrow(
        'Query execution failed',
      );
    });
  });

  describe('findOne', () => {
    const channelId = 1;

    it('should return a channel when it exists', async () => {
      const expectedResponse = [
        {
          id: channelId,
          senderId: 101,
          recipientId: 201,
          totalCount: 5,
          status: 'accepted',
        },
      ];

      mockRepository.query.mockResolvedValue(expectedResponse);

      const result = await service.findOne(2000, 2006);

      expect(result).toEqual({
        id: channelId,
        sender: expectedResponse[0].senderId,
        recipient: expectedResponse[0].recipientId,
        active_at: NaN,
        message_count: expectedResponse[0].totalCount,
        status: expectedResponse[0].status,
      });
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.any(String),
        [2000, 2006],
      );
    });

    it('should throw an error when no channel is found', async () => {
      mockRepository.query.mockResolvedValue([]);

      await expect(service.findOne(2000, 1987)).rejects.toThrow(
        `No channel found with sender ID ${2000} or recipient ID ${1987}.`,
      );
    });

    it('should throw an error when the query execution fails', async () => {
      mockRepository.query.mockRejectedValue(
        new Error('Query execution failed'),
      );

      await expect(service.findOne(2000, 2006)).rejects.toThrow(
        'Query execution failed',
      );
    });
  });
});
