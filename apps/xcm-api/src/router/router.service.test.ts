import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TChain, TLocation } from '@paraspell/sdk';
import { InvalidCurrencyError } from '@paraspell/sdk';
import type {
  TRouterDryRunResult,
  TRouterXcmFeeResult,
} from '@paraspell/xcm-router';
import { getExchangePairs, RouterBuilder } from '@paraspell/xcm-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RouterDto } from './dto/RouterDto.js';
import { RouterService } from './router.service.js';

const mockHex = '0x1234567890abcdef';

const tx = {
  getEncodedData: vi.fn().mockResolvedValue({
    asHex: vi.fn().mockReturnValue(mockHex),
  }),
};

const mockApi = {
  destroy: vi.fn(),
};

const serializedExtrinsics = [
  {
    api: mockApi,
    chain: 'Astar',
    tx: tx,
    type: 'TRANSFER',
  },
  {
    api: mockApi,
    chain: 'Acala',
    tx: tx,
    type: 'SWAP',
  },
  {
    api: mockApi,
    chain: 'Moonbeam',
    tx: tx,
    type: 'TRANSFER',
  },
];

const dryRunResponse = {
  origin: { chain: 'Astar' },
  hops: [],
} as unknown as TRouterDryRunResult;

const builderMock = {
  from: vi.fn().mockReturnThis(),
  exchange: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currencyFrom: vi.fn().mockReturnThis(),
  currencyTo: vi.fn().mockReturnThis(),
  feeAsset: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  senderAddress: vi.fn().mockReturnThis(),
  evmSenderAddress: vi.fn().mockReturnThis(),
  recipientAddress: vi.fn().mockReturnThis(),
  slippagePct: vi.fn().mockReturnThis(),
  buildTransactions: vi.fn().mockResolvedValue(serializedExtrinsics),
  getBestAmountOut: vi.fn().mockResolvedValue('1000000000000000000'),
  getXcmFees: vi.fn().mockResolvedValue({} as TRouterXcmFeeResult),
  getTransferableAmount: vi.fn().mockResolvedValue(123n),
  getMinTransferableAmount: vi.fn().mockResolvedValue(0n),
  dryRun: vi.fn().mockResolvedValue(dryRunResponse),
};

vi.mock('@paraspell/xcm-router', async () => {
  const actual = await vi.importActual('@paraspell/xcm-router');
  return {
    ...actual,
    RouterBuilder: vi.fn().mockImplementation(() => builderMock),
    getExchangePairs: vi.fn().mockReturnValue([
      [
        {
          symbol: 'ASTR',
          assetId: '0x1234567890abcdef',
          location: {} as TLocation,
        },
        {
          symbol: 'GLMR',
          assetId: '0xabcdef1234567890',
          location: {} as TLocation,
        },
      ],
    ]),
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
    senderAddress: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
    recipientAddress: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
  };

  const invalidChain = 'Astarr';

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouterService],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  describe('dryRun', () => {
    it('should return dry run result', async () => {
      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.dryRun(options);

      expect(result).toBe(dryRunResponse);
      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
      expect(builderMock.dryRun).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid sender address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        senderAddress: invalidChain,
      };

      await expect(service.dryRun(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid from chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        from: invalidChain as TChain,
      };

      await expect(service.dryRun(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when unknown error occurs', async () => {
      const builderMockWithError = {
        ...builderMock,
        dryRun: vi.fn().mockImplementation(() => {
          throw new Error('Unknown error');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.dryRun(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException when InvalidCurrencyError occurs', async () => {
      const builderMockWithError = {
        ...builderMock,
        dryRun: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.dryRun(options)).rejects.toThrow(
        BadRequestException,
      );
    });
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
        expect(transaction.chain).toBe(serializedExtrinsics[index].chain);
        expect(transaction.tx).toBe(mockHex);
        expect(transaction.type).toBe(serializedExtrinsics[index].type);
      });

      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
    });

    it('should generate 3 extrinsics with automatic exchange selection', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        exchange: undefined,
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.generateExtrinsics(modifiedOptions);

      result.forEach((transaction, index) => {
        expect(transaction.chain).toBe(serializedExtrinsics[index].chain);
        expect(transaction.tx).toBe(mockHex);
        expect(transaction.type).toBe(serializedExtrinsics[index].type);
      });

      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith(undefined);
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
    });

    it('should throw BadRequestException for invalid from chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        from: invalidChain as TChain,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        to: invalidChain as TChain,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid exchange chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        exchange: invalidChain as TChain,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid injector address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        senderAddress: invalidChain,
      };

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid recipient address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        recipientAddress: invalidChain,
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

  describe('getXcmFees', () => {
    it('should generate xcm fees ', async () => {
      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.getXcmFees(options);

      expect(result).toEqual({} as TRouterXcmFeeResult);
      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
    });

    it('should throw BadRequestException for invalid from chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        from: invalidChain as TChain,
      };

      await expect(service.getXcmFees(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        to: invalidChain as TChain,
      };

      await expect(service.getXcmFees(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid exchange chain', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        exchange: invalidChain as TChain,
      };

      await expect(service.getXcmFees(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid injector address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        senderAddress: invalidChain,
      };

      await expect(service.getXcmFees(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid recipient address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        recipientAddress: invalidChain,
      };

      await expect(service.getXcmFees(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when uknown error occures in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        getXcmFees: vi.fn().mockImplementation(() => {
          throw new Error('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.getXcmFees(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InvalidCurrencyError when InvalidCurrencyError error occures in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        getXcmFees: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.getXcmFees(options)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransferableAmount', () => {
    it('should return transferable amount', async () => {
      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.getTransferableAmount(options);

      expect(result).toBe(123n);
      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
      expect(builderMock.getTransferableAmount).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid sender address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        senderAddress: invalidChain,
      };

      await expect(
        service.getTransferableAmount(modifiedOptions),
      ).rejects.toThrow(BadRequestException);

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when unknown error occurs in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        getTransferableAmount: vi.fn().mockImplementation(() => {
          throw new Error('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.getTransferableAmount(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getMinTransferableAmount', () => {
    it('should return min transferable amount', async () => {
      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.getMinTransferableAmount(options);

      expect(result).toBe(0n);
      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
      expect(builderMock.getMinTransferableAmount).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid sender address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        senderAddress: invalidChain,
      };

      await expect(
        service.getMinTransferableAmount(modifiedOptions),
      ).rejects.toThrow(BadRequestException);

      expect(builderMock.from).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when unknown error occurs in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        getMinTransferableAmount: vi.fn().mockImplementation(() => {
          throw new Error('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.getMinTransferableAmount(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getBestAmountOut', () => {
    it('should return best amount out for the given parameters', async () => {
      vi.mocked(RouterBuilder).mockReturnValue(
        builderMock as unknown as ReturnType<typeof RouterBuilder>,
      );

      const result = await service.getBestAmountOut(options);

      if (Array.isArray(result)) {
        throw new Error('Expected a best amount out return value');
      }

      expect(builderMock.from).toHaveBeenCalledWith('Astar');
      expect(builderMock.exchange).toHaveBeenCalledWith('AcalaDex');
      expect(builderMock.to).toHaveBeenCalledWith('Moonbeam');
      expect(builderMock.getBestAmountOut).toHaveBeenCalled();
      expect(result).toBe('1000000000000000000');
    });

    it('should throw InternalServerError when uknown error occures in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        getBestAmountOut: vi.fn().mockImplementation(() => {
          throw new Error('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.getBestAmountOut(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InvalidCurrencyError when InvalidCurrencyError error occures in the spell router', async () => {
      const builderMockWithError = {
        ...builderMock,
        getBestAmountOut: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('Invalid currency');
        }),
      };

      vi.mocked(RouterBuilder).mockReturnValue(
        builderMockWithError as unknown as ReturnType<typeof RouterBuilder>,
      );

      await expect(service.getBestAmountOut(options)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getExchangePairs', () => {
    it('should return exchange pairs for the given exchange', () => {
      const exchange = 'AcalaDex';
      const expectedPairs = [
        [
          {
            symbol: 'ASTR',
            assetId: '0x1234567890abcdef',
            location: {} as TLocation,
          },
          {
            symbol: 'GLMR',
            assetId: '0xabcdef1234567890',
            location: {} as TLocation,
          },
        ],
      ];
      const result = service.getExchangePairs(exchange);
      expect(getExchangePairs).toHaveBeenCalledWith(exchange);
      expect(result).toEqual(expectedPairs);
    });
  });
});
