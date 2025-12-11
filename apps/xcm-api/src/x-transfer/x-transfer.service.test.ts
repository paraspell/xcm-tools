import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type {
  TAssetInfo,
  TChain,
  TDryRunResult,
  TGetXcmFeeResult,
} from '@paraspell/sdk';
import {
  InvalidCurrencyError,
  ScenarioNotSupportedError,
} from '@paraspell/sdk';
import * as paraspellSdk from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import type {
  DryRunPreviewDto,
  XTransferDto,
  XTransferDtoWSenderAddress,
} from './dto/XTransferDto.js';
import { XTransferService } from './x-transfer.service.js';

const txHash = '0x123';
const txHashBatch = '0x123456';
const dryRunResult: TDryRunResult = {
  origin: {
    success: true,
    fee: 1n,
    asset: {
      symbol: 'DOT',
    } as TAssetInfo,
    forwardedXcms: [],
  },
  hops: [],
};

const feeResult: TGetXcmFeeResult = {
  origin: {
    fee: 1n,
    asset: {
      symbol: 'DOT',
    } as TAssetInfo,
    feeType: 'dryRun',
  },
  hops: [],
  destination: {
    fee: 1n,
    asset: {
      symbol: 'DOT',
    } as TAssetInfo,
    feeType: 'dryRun',
  },
};

const amountResult = 100n;

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  feeAsset: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  senderAddress: vi.fn().mockReturnThis(),
  ahAddress: vi.fn().mockReturnThis(),
  xcmVersion: vi.fn().mockReturnThis(),
  addToBatch: vi.fn().mockReturnThis(),
  customPallet: vi.fn().mockReturnThis(),
  buildBatch: vi.fn().mockReturnValue({
    getEncodedData: vi.fn().mockResolvedValue({
      asHex: vi.fn().mockReturnValue(txHashBatch),
    }),
  }),
  build: vi.fn().mockResolvedValue({
    getEncodedData: vi.fn().mockResolvedValue({
      asHex: vi.fn().mockReturnValue(txHash),
    }),
  }),
  dryRun: vi.fn().mockResolvedValue(dryRunResult),
  dryRunPreview: vi.fn().mockResolvedValue(dryRunResult),
  getXcmFee: vi.fn().mockResolvedValue(feeResult),
  getOriginXcmFee: vi.fn().mockResolvedValue(feeResult),
  getXcmFeeEstimate: vi.fn().mockResolvedValue(feeResult),
  getOriginXcmFeeEstimate: vi.fn().mockResolvedValue(feeResult),
  getTransferableAmount: vi.fn().mockResolvedValue(amountResult),
  getMinTransferableAmount: vi.fn().mockResolvedValue(amountResult),
  verifyEdOnDestination: vi.fn().mockResolvedValue(true),
  getTransferInfo: vi.fn().mockResolvedValue({}),
  getReceivableAmount: vi.fn().mockResolvedValue(amountResult),
  disconnect: vi.fn(),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getBridgeStatus: vi.fn(),
    Builder: vi.fn().mockImplementation(() => builderMock),
    getParaEthTransferFees: vi.fn().mockResolvedValue([0n, 0n]),
  };
});

describe('XTransferService', () => {
  let service: XTransferService;

  const address = '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';
  const senderAddress = '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';
  const currency = { symbol: 'DOT', amount: 100 };
  const invalidChain = 'InvalidChain';

  const xTransferDto: XTransferDtoWSenderAddress = {
    from: 'Acala',
    to: 'Astar',
    address,
    senderAddress,
    currency,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [XTransferService],
    }).compile();

    service = module.get<XTransferService>(XTransferService);

    vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
      builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
    );
  });

  describe('generateXcmCall', () => {
    it('should generate XCM call for parachain to parachain transfer', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        senderAddress: undefined,
      };

      const result = await service.generateXcmCall(options);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(xTransferDto.from);
      expect(builderMock.to).toHaveBeenCalledWith(xTransferDto.to);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for parachain to parachain transfer', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        senderAddress: undefined,
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      const result = await service.generateXcmCall(options);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(xTransferDto.from);
      expect(builderMock.to).toHaveBeenCalledWith(xTransferDto.to);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for parachain to relaychain transfer', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        to: 'Polkadot',
        senderAddress: undefined,
      };

      const result = await service.generateXcmCall(options);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(options.from);
      expect(builderMock.to).toHaveBeenCalledWith(options.to);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for relaychain to parachain transfer', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Polkadot',
        currency: { symbol: 'DOT', amount: 100 },
        senderAddress: undefined,
      };

      const result = await service.generateXcmCall(options);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(options.from);
      expect(builderMock.to).toHaveBeenCalledWith(options.to);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid from chain', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: invalidChain,
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid to chain', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        to: invalidChain,
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw IncompatibleChainsError for incompatible from and to chains', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Acala',
        to: 'Moonriver',
      };

      const builderMockWithError = {
        ...builderMock,
        build: vi.fn().mockImplementation(() => {
          throw new ScenarioNotSupportedError('Incompatible chains');
        }),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMockWithError as unknown as ReturnType<
          typeof paraspellSdk.Builder
        >,
      );

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerError when uknown error occures in the SDK', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Acala',
        to: 'Basilisk',
      };

      const builderMockWithError = {
        ...builderMock,
        build: vi.fn().mockImplementation(() => {
          throw new Error('Unknown error');
        }),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMockWithError as unknown as ReturnType<
          typeof paraspellSdk.Builder
        >,
      );

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw on invalid wallet address', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        address: 'invalid-address',
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should specify xcm version if provided', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        xcmVersion: paraspellSdk.Version.V3,
      };

      await service.generateXcmCall(options);

      expect(builderMock.xcmVersion).toHaveBeenCalledWith(
        paraspellSdk.Version.V3,
      );
    });

    it('should throw BadRequestException when sender address is missing', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Hydration',
        to: 'Ethereum',
        senderAddress: undefined,
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when pallet or method are not provided', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        pallet: 'Balances',
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should succeed when both pallet and method are provided', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        pallet: 'Balances',
        method: 'transfer',
      };

      const result = await service.generateXcmCall(options);

      expect(result).toBe(txHash);
      expect(builderMock.customPallet).toHaveBeenCalledWith(
        'Balances',
        'transfer',
      );
    });
  });

  describe('dryRun', () => {
    it('returns SDK dry-run result', async () => {
      const dto: XTransferDto = { ...xTransferDto, senderAddress: 'alice' };

      const result = await service.dryRun(dto);

      expect(result).toBe(dryRunResult);
      expect(builderMock.dryRun).toHaveBeenCalledWith();
      expect(builderMock.senderAddress).toHaveBeenCalledWith('alice');
    });

    it('maps SDK errors inside dryRun to BadRequestException', async () => {
      const builderErr = {
        ...builderMock,
        dryRun: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('some error');
        }),
      };
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderErr as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      await expect(
        service.dryRun({ ...xTransferDto, senderAddress: 'alice' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('dryRunPreview', () => {
    it('returns SDK dry-run result', async () => {
      const dto: DryRunPreviewDto = {
        ...xTransferDto,
        senderAddress: 'alice',
        options: { mintFeeAssets: false },
      };

      const result = await service.dryRunPreview(dto);

      expect(result).toBe(dryRunResult);
      expect(builderMock.dryRunPreview).toHaveBeenCalledWith({
        mintFeeAssets: false,
      });
    });
  });

  describe('getXcmFee', () => {
    it('delegates to builder.getXcmFee', async () => {
      const res = await service.getXcmFee(xTransferDto);
      expect(res).toBe(feeResult);
      expect(builderMock.getXcmFee).toHaveBeenCalled();
    });
  });

  describe('getOriginXcmFee', () => {
    it('delegates to builder.getOriginXcmFee', async () => {
      const res = await service.getOriginXcmFee(xTransferDto);
      expect(res).toBe(feeResult);
      expect(builderMock.getOriginXcmFee).toHaveBeenCalled();
    });
  });

  describe('getXcmFeeEstimate', () => {
    it('delegates to builder.getXcmFeeEstimate', async () => {
      const res = await service.getXcmFeeEstimate(xTransferDto);
      expect(res).toBe(feeResult);
      expect(builderMock.getXcmFeeEstimate).toHaveBeenCalled();
    });
  });

  describe('getOriginXcmFeeEstimate', () => {
    it('delegates to builder.getOriginXcmFeeEstimate', async () => {
      const res = await service.getOriginXcmFeeEstimate(xTransferDto);
      expect(res).toBe(feeResult);
      expect(builderMock.getOriginXcmFeeEstimate).toHaveBeenCalled();
    });
  });

  describe('getTransferableAmount', () => {
    it('delegates to builder.getTransferableAmount', async () => {
      const res = await service.getTransferableAmount(xTransferDto);
      expect(res).toBe(amountResult);
      expect(builderMock.getTransferableAmount).toHaveBeenCalled();
    });
  });

  describe('getMinTransferableAmount', () => {
    it('delegates to builder.getMinTransferableAmount', async () => {
      const res = await service.getMinTransferableAmount(xTransferDto);
      expect(res).toBe(amountResult);
      expect(builderMock.getMinTransferableAmount).toHaveBeenCalled();
    });
  });

  describe('verifyEdOnDestination', () => {
    it('delegates to builder.verifyEdOnDestination', async () => {
      const res = await service.verifyEdOnDestination(xTransferDto);
      expect(res).toBe(true);
      expect(builderMock.verifyEdOnDestination).toHaveBeenCalled();
    });
  });

  describe('getTransferInfo', () => {
    it('delegates to builder.getTransferInfo', async () => {
      const res = await service.getTransferInfo(xTransferDto);
      expect(res).toEqual({});
      expect(builderMock.getTransferInfo).toHaveBeenCalled();
    });
  });

  describe('getReceivableAmount', () => {
    it('delegates to builder.getReceivableAmount', async () => {
      const res = await service.getReceivableAmount(xTransferDto);
      expect(res).toBe(amountResult);
      expect(builderMock.getReceivableAmount).toHaveBeenCalled();
    });
  });

  describe('generateBatchXcmCall', () => {
    it('should generate batch XCM call for valid transfers', async () => {
      const from: TChain = 'Acala';
      const to1: TChain = 'Basilisk';
      const to2: TChain = 'Moonriver';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to: to1,
            address,
            currency,
          },
          {
            from,
            to: to2,
            address,
            currency,
          },
        ],
        options: {
          mode: paraspellSdk.BatchMode.BATCH_ALL,
        },
      };

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.from).toHaveBeenCalledTimes(2);
      expect(builderMock.to).toHaveBeenCalledWith(to1);
      expect(builderMock.to).toHaveBeenCalledWith(to2);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(2);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should generate batch XCM call for valid transfers', async () => {
      const from: TChain = 'Acala';
      const to1: TChain = 'Basilisk';
      const to2: TChain = 'Moonriver';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to: to1,
            address,
            currency,
          },
          {
            from,
            to: to2,
            address,
            currency,
          },
        ],
        options: {
          mode: paraspellSdk.BatchMode.BATCH_ALL,
        },
      };

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.from).toHaveBeenCalledTimes(2);
      expect(builderMock.to).toHaveBeenCalledWith(to1);
      expect(builderMock.to).toHaveBeenCalledWith(to2);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(2);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should generate batch XCM call for valid relay to parachain transfers', async () => {
      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from: 'Polkadot',
            to: 'Acala',
            currency: { symbol: 'DOT', amount: 100 },
            address,
          },
        ],
        options: {
          mode: paraspellSdk.BatchMode.BATCH_ALL,
        },
      };

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.from).toHaveBeenCalledWith('Polkadot');
      expect(builderMock.to).toHaveBeenCalledWith('Acala');
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(1);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should throw BadRequestException when transfers array is empty', async () => {
      const batchDto: BatchXTransferDto = {
        transfers: [],
        options: {
          mode: paraspellSdk.BatchMode.BATCH_ALL,
        },
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when transfers have different from chains', async () => {
      const from1: TChain = 'Acala';
      const from2: TChain = 'Basilisk';
      const to: TChain = 'Moonriver';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from: from1,
            to,
            address,
            currency,
          },
          {
            from: from2,
            to,
            address,
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid from chain', async () => {
      const to: TChain = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from: invalidChain,
            to,
            address,
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid to chain', async () => {
      const from: TChain = 'Acala';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to: invalidChain,
            address,
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid wallet address', async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address: 'invalid-address',
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid currency', async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Basilisk';
      const invalidCurrency = { symbol: 'UNKNOWN', amount: 100 };

      const builderMockWithError = {
        ...builderMock,
        currency: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('Invalid currency');
        }),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMockWithError as unknown as ReturnType<
          typeof paraspellSdk.Builder
        >,
      );

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address,
            currency: invalidCurrency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unknown errors from SDK', async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Basilisk';

      const builderMockWithError = {
        ...builderMock,
        buildBatch: vi.fn().mockImplementation(() => {
          throw new Error('Unknown error');
        }),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMockWithError as unknown as ReturnType<
          typeof paraspellSdk.Builder
        >,
      );

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address,
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException when toChain is an object', async () => {
      const from: TChain = 'Acala';
      const toChain = { some: 'object' }; // Invalid toChain

      const batchDto = {
        transfers: [
          {
            from,
            to: toChain,
            address,
            currency,
          },
        ],
      } as unknown as BatchXTransferDto;

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid transferToChain in transfers', async () => {
      const from: TChain = 'Acala';
      const invalidToChain = 'InvalidChain';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to: 'Acala',
            address,
            currency,
          },
          {
            from,
            to: invalidToChain,
            address,
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate batch XCM call for transfers with only fromChain (parachain to relaychain)', async () => {
      const from: TChain = 'Acala';

      const batchDto = {
        transfers: [
          {
            from,
            to: 'Polkadot',
            currency: { symbol: 'DOT' },
            address,
          },
        ],
        options: undefined,
      } as unknown as BatchXTransferDto;

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.from).toHaveBeenCalledWith(from);
      expect(builderMock.to).toHaveBeenCalledWith('Polkadot');
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.senderAddress).toHaveBeenCalledWith(undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(1);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should apply xcmVersion if provided in transfer', async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address,
            currency,
            xcmVersion: paraspellSdk.Version.V3,
          },
        ],
      };

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.xcmVersion).toHaveBeenCalledWith(
        paraspellSdk.Version.V3,
      );
    });

    it('should throw BadRequestException when pallet or method not provided', async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address,
            currency,
            pallet: 'Balances',
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should succeed when pallet and method are provided', async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address,
            currency,
            pallet: 'Balances',
            method: 'transfer',
          },
        ],
      };

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.customPallet).toHaveBeenCalledWith(
        'Balances',
        'transfer',
      );
    });
  });

  describe('getBridgeStatus', () => {
    it('should return bridge status', async () => {
      vi.mocked(paraspellSdk.getBridgeStatus).mockResolvedValue('Normal');

      const status = await service.getBridgeStatus();

      expect(status).toEqual('Normal');
    });
  });

  describe('getParaEthFees', () => {
    it('should return para eth transfer fees', async () => {
      const result = await service.getParaEthFees();
      expect(result).toEqual([0n, 0n]);
    });
  });
});
