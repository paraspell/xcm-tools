import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { CountOption } from './count-option';
import { Message } from './message.entity';
import { MessageService } from './messages.service';

describe('MessageService', () => {
  let service: MessageService;
  let mockRepository: Partial<Record<keyof Repository<Message>, jest.Mock>>;

  beforeEach(async () => {
    mockRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  describe('countMessagesByStatus', () => {
    const startTime = 1633046400;
    const endTime = 1633132800;
    const paraIds = [101, 102];

    it('should return status counts for each paraId when paraIds are provided', async () => {
      mockRepository.count.mockImplementation(
        ({ where: { _origin_para_id, status } }) =>
          Promise.resolve(status === 'success' ? 3 : 1),
      );

      const results = await service.countMessagesByStatus(
        paraIds,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        { paraId: 101, success: 3, failed: 1 },
        { paraId: 102, success: 3, failed: 1 },
      ]);
      expect(mockRepository.count).toHaveBeenCalledTimes(4);
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            origin_para_id: 101,
            status: 'success',
          }),
        }),
      );
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            origin_para_id: 102,
            status: 'failed',
          }),
        }),
      );
    });

    it('should return aggregated status counts when no paraIds are provided', async () => {
      mockRepository.count.mockImplementation(({ where: { status } }) =>
        Promise.resolve(status === 'success' ? 10 : 5),
      );

      const results = await service.countMessagesByStatus(
        undefined,
        startTime,
        endTime,
      );

      expect(results).toEqual([{ success: 10, failed: 5 }]);
      expect(mockRepository.count).toHaveBeenCalledTimes(2);
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'success' }),
        }),
      );
    });
  });

  describe('countMessagesByDay', () => {
    const startTime = 1633046400;
    const endTime = 1633132800;
    const paraIds = [101, 102];

    it('should return message counts by day for each paraId', async () => {
      mockRepository.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            paraId: 101,
            date: '2023-09-01',
            message_count_success: '3',
            message_count_failed: '1',
          },
          {
            paraId: 101,
            date: '2023-09-02',
            message_count_success: '2',
            message_count_failed: '0',
          },
          {
            paraId: 102,
            date: '2023-09-01',
            message_count_success: '5',
            message_count_failed: '2',
          },
        ]),
      });

      const results = await service.countMessagesByDay(
        paraIds,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        {
          paraId: 101,
          date: '2023-09-01',
          messageCount: 4,
          messageCountSuccess: 3,
          messageCountFailed: 1,
        },
        {
          paraId: 101,
          date: '2023-09-02',
          messageCount: 2,
          messageCountSuccess: 2,
          messageCountFailed: 0,
        },
        {
          paraId: 102,
          date: '2023-09-01',
          messageCount: 7,
          messageCountSuccess: 5,
          messageCountFailed: 2,
        },
      ]);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('should return message counts by day when no paraIds are provided', async () => {
      mockRepository.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            date: '2023-09-01',
            message_count_success: '8',
            message_count_failed: '3',
          },
          {
            date: '2023-09-02',
            message_count_success: '6',
            message_count_failed: '1',
          },
        ]),
      });

      const results = await service.countMessagesByDay([], startTime, endTime);

      expect(results).toEqual([
        {
          date: '2023-09-01',
          messageCount: 11,
          messageCountSuccess: 8,
          messageCountFailed: 3,
        },
        {
          date: '2023-09-02',
          messageCount: 7,
          messageCountSuccess: 6,
          messageCountFailed: 1,
        },
      ]);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTotalMessageCounts', () => {
    const startTime = 1633046400;
    const endTime = 1633132800;
    const mockCounts = [
      { paraId: 101, totalCount: '10' },
      { paraId: 102, totalCount: '5' },
    ];

    type MockQueryBuilder = {
      select: jest.Mock;
      addSelect: jest.Mock;
      where: jest.Mock;
      groupBy: jest.Mock;
      getRawMany: jest.Mock;
      addGroupBy: jest.Mock;
    };

    it.each([
      [CountOption.ORIGIN, 'message.origin_para_id', 'paraId'],
      [CountOption.DESTINATION, 'message.dest_para_id', 'paraId'],
    ])(
      'should return message counts for %s',
      async (countBy, selectColumn, alias) => {
        const mockQueryBuilder: MockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue(mockCounts),
          addGroupBy: jest.fn().mockReturnThis(),
        };
        mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const results = await service.getTotalMessageCounts(
          startTime,
          endTime,
          countBy,
        );

        expect(results).toEqual(
          mockCounts.map((item) => ({
            paraId: item.paraId,
            totalCount: parseInt(item.totalCount),
          })),
        );
        expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(mockQueryBuilder.select).toHaveBeenCalledWith(
          selectColumn,
          alias,
        );
      },
    );

    it('should combine counts for both origin and destination', async () => {
      const mockQueryBuilderOrigin: MockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ paraId: 101, totalCount: '5' }]),
        addGroupBy: jest.fn().mockReturnThis(),
      };
      const mockQueryBuilderDestination: MockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { paraId: 101, totalCount: '7' },
          { paraId: 102, totalCount: '3' },
        ]),
        addGroupBy: jest.fn().mockReturnThis(),
      };
      mockRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilderOrigin)
        .mockReturnValueOnce(mockQueryBuilderDestination);

      const results = await service.getTotalMessageCounts(
        startTime,
        endTime,
        CountOption.BOTH,
      );

      expect(results).toEqual([
        { paraId: 101, totalCount: 12 },
        { paraId: 102, totalCount: 3 },
      ]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });

  describe('countAssetsBySymbol', () => {
    const startTime = 1633046400;
    const endTime = 1633132800;
    const paraIds = [101, 102];

    it('should return asset counts by symbol for each paraId when paraIds are provided', async () => {
      const mockResult = [
        { origin_para_id: 101, symbol: 'GOLD', count: '3' },
        { origin_para_id: 102, symbol: 'SILVER', count: '5' },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.countAssetsBySymbol(
        paraIds,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        { paraId: 101, symbol: 'GOLD', count: 3 },
        { paraId: 102, symbol: 'SILVER', count: 5 },
      ]);
      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        startTime,
        endTime,
        paraIds,
      ]);
    });

    it('should return asset counts by symbol when no paraIds are provided', async () => {
      const mockResult = [
        { symbol: 'GOLD', count: '10' },
        { symbol: 'SILVER', count: '7' },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.countAssetsBySymbol([], startTime, endTime);

      expect(results).toEqual([
        { symbol: 'GOLD', count: 10 },
        { symbol: 'SILVER', count: 7 },
      ]);
      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        startTime,
        endTime,
      ]);
    });
  });

  describe('getAccountXcmCounts', () => {
    const startTime = 1633046400;
    const endTime = 1633132800;
    const paraIds = [101, 102];
    const threshold = 5;

    it('should return account message counts when paraIds are provided', async () => {
      const mockResult = [
        { from_account_id: 'account1', message_count: '6' },
        { from_account_id: 'account2', message_count: '7' },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.getAccountXcmCounts(
        paraIds,
        threshold,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        { id: 'account1', count: 6 },
        { id: 'account2', count: 7 },
      ]);

      // Ensure that the WHERE clause includes paraIds
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE origin_block_timestamp BETWEEN'),
        [startTime, endTime, ...paraIds, threshold],
      );
    });

    it('should return account message counts when no paraIds are provided', async () => {
      const mockResult = [{ from_account_id: 'account3', message_count: '8' }];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.getAccountXcmCounts(
        [],
        threshold,
        startTime,
        endTime,
      );

      expect(results).toEqual([{ id: 'account3', count: 8 }]);

      // Ensure that the WHERE clause does not include paraIds
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.not.stringContaining('origin_para_id IN'),
        [startTime, endTime, threshold],
      );
    });

    it('should handle exceptions', async () => {
      mockRepository.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getAccountXcmCounts(paraIds, threshold, startTime, endTime),
      ).rejects.toThrow('Database error');

      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        startTime,
        endTime,
        ...paraIds,
        threshold,
      ]);
    });
  });
});
