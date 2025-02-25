import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RouterService } from './router.service.js';
import type { RouterDto } from './dto/RouterDto.js';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TNode } from '@paraspell/sdk';
import { InvalidCurrencyError } from '@paraspell/sdk';
import { RouterBuilder } from '@paraspell/xcm-router';
import type { TPjsApi } from '@paraspell/sdk-pjs';

const txHash = '0x123';

const mockApi = {
  disconnect: vi.fn(),
} as unknown as TPjsApi;

const serializedExtrinsics = [
  {
    api: mockApi,
    node: 'Astar',
    tx: txHash,
    type: 'TRANSFER',
  },
  {
    api: mockApi,
    node: 'Acala',
    tx: txHash,
    type: 'SWAP',
  },
  {
    api: mockApi,
    node: 'Moonbeam',
    tx: txHash,
    type: 'TRANSFER',
  },
];

const builderMock = {
  from: vi.fn().mockReturnThis(),
  exchange: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currencyFrom: vi.fn().mockReturnThis(),
  currencyTo: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  senderAddress: vi.fn().mockReturnThis(),
  evmSenderAddress: vi.fn().mockReturnThis(),
  recipientAddress: vi.fn().mockReturnThis(),
  slippagePct: vi.fn().mockReturnThis(),
  buildTransactions: vi.fn().mockResolvedValue(serializedExtrinsics),
};

vi.mock('@paraspell/xcm-router', async () => {
  const actual = await vi.importActual('@paraspell/xcm-router');
  return {
    ...actual,
    RouterBuilder: vi.fn().mockImplementation(() => builderMock),
  };
});

describe('RouterService', () => {
  let service: RouterService;

  const options: RouterDto = {
    from: 'Astar',
    exchange: 'AcalaDex',
    to: 'Moonbeam',
    currencyFrom: { symbol: 'ASTR' },
    currencyTo: { symbol: 'GLMR' },
    amount: '1000000000000000000',
    senderAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
    recipientAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
  };

  const invalidNode = 'Astarr';

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouterService],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExtrinsics', () => {
    it('should generate 3 extrinsics with manual exchange selection', async () => {
      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.generateExtrinsics(options);

      result.forEach((transaction, index) => {
        expect(transaction.node).toBe(serializedExtrinsics[index].node);
        expect(transaction.tx).toBe(serializedExtrinsics[index].tx);
        expect(transaction.type).toBe(serializedExtrinsics[index].type);
      });

      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
    });

    it('should throw BadRequestException for invalid from node', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        from: invalidNode as TNode,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to node', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        to: invalidNode as TNode,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid exchange node', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        exchange: invalidNode as TNode,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid injector address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        senderAddress: invalidNode,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid recipient address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        recipientAddress: invalidNode,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when uknown error occures in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        buildTransactions: vi.fn().mockImplementation(() => {
          throw new Error('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.generateExtrinsics(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InvalidCurrencyError when InvalidCurrencyError error occures in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        buildTransactions: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.generateExtrinsics(options)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
