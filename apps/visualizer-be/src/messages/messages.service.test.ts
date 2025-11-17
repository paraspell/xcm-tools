import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import { getParaId, getRelayChainOf, getTChain } from '@paraspell/sdk';
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
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;
    const parachains: TSubstrateChain[] = ['AssetHubPolkadot', 'Acala'];

    it('should return status counts for each paraId when paraIds are provided', async () => {
      mockRepository.count.mockImplementation(({ where: { status } }) =>
        Promise.resolve(status === 'success' ? 3 : 1),
      );

      const expectedEcosystems = parachains.map((chain) =>
        getRelayChainOf(chain).toLowerCase(),
      );

      const results = await service.countMessagesByStatus(
        ecosystem,
        parachains,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        {
          ecosystem: expectedEcosystems[0],
          parachain: 'AssetHubPolkadot',
          success: 3,
          failed: 1,
        },
        {
          ecosystem: expectedEcosystems[1],
          parachain: 'Acala',
          success: 3,
          failed: 1,
        },
      ]);
      expect(mockRepository.count).toHaveBeenCalledTimes(4);
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ecosystem,
            origin_para_id: getParaId(parachains[0]),
            status: 'success',
          }),
        }),
      );
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ecosystem,
            origin_para_id: getParaId(parachains[1]),
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
        ecosystem,
        undefined,
        startTime,
        endTime,
      );

      expect(results).toEqual([{ ecosystem, success: 10, failed: 5 }]);
      expect(mockRepository.count).toHaveBeenCalledTimes(2);
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'success' }),
        }),
      );
    });
  });

  describe('countMessagesByDay', () => {
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;
    const parachains: TSubstrateChain[] = ['AssetHubPolkadot', 'Acala'];

    it('should return message counts by day for each paraId', async () => {
      const [assetHubParaId, acalaParaId] = parachains.map((p) => getParaId(p));
      mockRepository.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            ecosystem,
            paraId: assetHubParaId.toString(),
            parachain: 'AssetHubPolkadot',
            date: '2023-09-01',
            message_count: '4',
            message_count_success: '3',
            message_count_failed: '1',
          },
          {
            ecosystem,
            paraId: assetHubParaId.toString(),
            parachain: 'AssetHubPolkadot',
            date: '2023-09-02',
            message_count: '2',
            message_count_success: '2',
            message_count_failed: '0',
          },
          {
            ecosystem,
            paraId: acalaParaId.toString(),
            parachain: 'Acala',
            date: '2023-09-01',
            message_count: '7',
            message_count_success: '5',
            message_count_failed: '2',
          },
        ]),
      });

      const results = await service.countMessagesByDay(
        ecosystem,
        parachains,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        {
          ecosystem,
          parachain: 'AssetHubPolkadot',
          date: '2023-09-01',
          messageCount: 4,
          messageCountSuccess: 3,
          messageCountFailed: 1,
        },
        {
          ecosystem,
          parachain: 'AssetHubPolkadot',
          date: '2023-09-02',
          messageCount: 2,
          messageCountSuccess: 2,
          messageCountFailed: 0,
        },
        {
          ecosystem,
          parachain: 'Acala',
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
            ecosystem,
            date: '2023-09-01',
            message_count: '11',
            message_count_success: '8',
            message_count_failed: '3',
          },
          {
            ecosystem,
            date: '2023-09-02',
            message_count: '7',
            message_count_success: '6',
            message_count_failed: '1',
          },
        ]),
      });

      const results = await service.countMessagesByDay(
        ecosystem,
        [],
        startTime,
        endTime,
      );

      expect(results).toEqual([
        {
          ecosystem,
          parachain: undefined,
          date: '2023-09-01',
          messageCount: 11,
          messageCountSuccess: 8,
          messageCountFailed: 3,
        },
        {
          ecosystem,
          parachain: undefined,
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
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;
    const mockCounts = [
      { ecosystem, paraId: 101, totalCount: '10' },
      { ecosystem, paraId: 102, totalCount: '5' },
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
          ecosystem,
          startTime,
          endTime,
          countBy,
        );

        expect(results).toEqual(
          mockCounts.map((item) => ({
            ecosystem,
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
          .mockResolvedValue([{ ecosystem, paraId: 101, totalCount: '5' }]),
        addGroupBy: jest.fn().mockReturnThis(),
      };
      const mockQueryBuilderDestination: MockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { ecosystem, paraId: 101, totalCount: '7' },
          { ecosystem, paraId: 102, totalCount: '3' },
        ]),
        addGroupBy: jest.fn().mockReturnThis(),
      };
      mockRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilderOrigin)
        .mockReturnValueOnce(mockQueryBuilderDestination);

      const results = await service.getTotalMessageCounts(
        ecosystem,
        startTime,
        endTime,
        CountOption.BOTH,
      );

      expect(results).toEqual([
        { ecosystem, paraId: 101, totalCount: 12 },
        { ecosystem, paraId: 102, totalCount: 3 },
      ]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });

  describe('countAssetsBySymbol', () => {
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;
    const parachains: TSubstrateChain[] = ['AssetHubPolkadot', 'Acala'];

    it('should return asset counts by symbol for each paraId when paraIds are provided', async () => {
      const paraIds = parachains.map((p) => getParaId(p));
      const ecosystemsList = parachains.map((p) =>
        getRelayChainOf(p).toLowerCase(),
      );
      const mockResult = [
        {
          origin_para_id: paraIds[0],
          symbol: 'GOLD',
          count: '3',
          ecosystem: ecosystemsList[0],
          amount: '69',
        },
        {
          origin_para_id: paraIds[1],
          symbol: 'SILVER',
          count: '5',
          ecosystem: ecosystemsList[1],
          amount: '420',
        },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.countAssetsBySymbol(
        ecosystem,
        parachains,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        {
          ecosystem: ecosystemsList[0],
          parachain: getTChain(
            paraIds[0],
            (ecosystemsList[0][0].toUpperCase() +
              ecosystemsList[0].slice(1)) as TRelaychain,
          ),
          symbol: 'GOLD',
          count: 3,
          amount: '69',
        },
        {
          ecosystem: ecosystemsList[1],
          parachain: getTChain(
            paraIds[1],
            (ecosystemsList[1][0].toUpperCase() +
              ecosystemsList[1].slice(1)) as TRelaychain,
          ),
          symbol: 'SILVER',
          count: 5,
          amount: '420',
        },
      ]);
      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        paraIds,
        ecosystemsList,
        startTime,
        endTime,
      ]);
    });

    it('should return asset counts by symbol when no paraIds are provided', async () => {
      const mockResult = [
        { ecosystem, symbol: 'GOLD', count: '10', amount: '69' },
        { ecosystem, symbol: 'SILVER', count: '7', amount: '420' },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.countAssetsBySymbol(
        ecosystem,
        [],
        startTime,
        endTime,
      );

      expect(results).toEqual([
        { ecosystem, symbol: 'GOLD', count: 10, amount: '69' },
        { ecosystem, symbol: 'SILVER', count: 7, amount: '420' },
      ]);
      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        ecosystem,
        startTime,
        endTime,
      ]);
    });
  });

  describe('getAccountXcmCounts', () => {
    const ecosystem = 'polkadot';
    const startTime = 1633046400;
    const endTime = 1633132800;
    const paraIds = [101, 102];
    const threshold = 5;

    it('should return account message counts when paraIds are provided', async () => {
      const mockResult = [
        { ecosystem, from_account_id: 'account1', message_count: '6' },
        { ecosystem, from_account_id: 'account2', message_count: '7' },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.getAccountXcmCounts(
        ecosystem,
        paraIds,
        threshold,
        startTime,
        endTime,
      );

      expect(results).toEqual([
        { ecosystem, id: 'account1', count: 6 },
        { ecosystem, id: 'account2', count: 7 },
      ]);

      // Ensure that the WHERE clause includes paraIds
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE ecosystem = $1 AND origin_block_timestamp BETWEEN',
        ),
        [ecosystem, startTime, endTime, ...paraIds, threshold],
      );
    });

    it('should return account message counts when no paraIds are provided', async () => {
      const mockResult = [
        { ecosystem, from_account_id: 'account3', message_count: '8' },
      ];
      mockRepository.query.mockResolvedValue(mockResult);

      const results = await service.getAccountXcmCounts(
        ecosystem,
        [],
        threshold,
        startTime,
        endTime,
      );

      expect(results).toEqual([{ ecosystem, id: 'account3', count: 8 }]);

      // Ensure that the WHERE clause does not include paraIds
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.not.stringContaining('origin_para_id IN'),
        [ecosystem, startTime, endTime, threshold],
      );
    });

    it('should handle exceptions', async () => {
      mockRepository.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getAccountXcmCounts(
          ecosystem,
          paraIds,
          threshold,
          startTime,
          endTime,
        ),
      ).rejects.toThrow('Database error');

      expect(mockRepository.query).toHaveBeenCalledWith(expect.any(String), [
        ecosystem,
        startTime,
        endTime,
        ...paraIds,
        threshold,
      ]);
    });
  });
});
