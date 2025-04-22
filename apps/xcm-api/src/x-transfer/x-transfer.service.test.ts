import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TDryRunResult, TGetXcmFeeResult, TNode } from '@paraspell/sdk';
import { IncompatibleNodesError, InvalidCurrencyError } from '@paraspell/sdk';
import * as paraspellSdk from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import type { XTransferDto } from './dto/XTransferDto.js';
import { XTransferService } from './x-transfer.service.js';

const txHash = '0x123';
const txHashBatch = '0x123456';
const dryRunResult: TDryRunResult = {
  success: true,
  fee: 1n,
  forwardedXcms: [],
};

const feeResult: TGetXcmFeeResult = {
  origin: {
    fee: 1n,
    feeType: 'dryRun',
    currency: 'DOT',
  },
  destination: {
    fee: 1n,
    currency: 'DOT',
    feeType: 'dryRun',
  },
};

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  feeAsset: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
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
  getXcmFee: vi.fn().mockResolvedValue(feeResult),
  getXcmFeeEstimate: vi.fn().mockResolvedValue(feeResult),
  disconnect: vi.fn(),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getBridgeStatus: vi.fn(),
    Builder: vi.fn().mockImplementation(() => builderMock),
  };
});

describe('XTransferService', () => {
  let service: XTransferService;

  const address = '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC';
  const currency = { symbol: 'DOT', amount: 100 };
  const invalidNode = 'InvalidNode';

  const xTransferDto: XTransferDto = {
    from: 'Acala',
    to: 'Astar',
    address,
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
      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(xTransferDto.from);
      expect(builderMock.to).toHaveBeenCalledWith(xTransferDto.to);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for parachain to parachain transfer', async () => {
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(xTransferDto.from);
      expect(builderMock.to).toHaveBeenCalledWith(xTransferDto.to);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for parachain to relaychain transfer', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        to: 'Polkadot',
      };

      const result = await service.generateXcmCall(options);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(options.from);
      expect(builderMock.to).toHaveBeenCalledWith(options.to);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for relaychain to parachain transfer', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Polkadot',
        currency: { symbol: 'DOT', amount: 100 },
      };

      const result = await service.generateXcmCall(options);

      expect(result).toBeTypeOf('string');
      expect(builderMock.from).toHaveBeenCalledWith(options.from);
      expect(builderMock.to).toHaveBeenCalledWith(options.to);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid from node', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: invalidNode,
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid to node', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        to: invalidNode,
      };

      await expect(service.generateXcmCall(options)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw IncompatibleNodesError for incompatible from and to nodes', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Acala',
        to: 'Moonriver',
      };

      const builderMockWithError = {
        ...builderMock,
        build: vi.fn().mockImplementation(() => {
          throw new IncompatibleNodesError('Incompatible nodes');
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
        xcmVersion: paraspellSdk.Version.V2,
      };

      await service.generateXcmCall(options);

      expect(builderMock.xcmVersion).toHaveBeenCalledWith(
        paraspellSdk.Version.V2,
      );
    });

    it('should throw BadRequestException when assetHub address is missing', async () => {
      const options: XTransferDto = {
        ...xTransferDto,
        from: 'Hydration',
        to: 'Ethereum',
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
      expect(builderMock.dryRun).toHaveBeenCalledWith('alice');
    });

    it('throws BadRequestException when senderAddress missing', () => {
      expect(() => service.dryRun({ ...xTransferDto })).toThrow(
        BadRequestException,
      );
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

  describe('getXcmFee', () => {
    it('delegates to builder.getXcmFee', async () => {
      const res = await service.getXcmFee(xTransferDto);
      expect(res).toBe(feeResult);
      expect(builderMock.getXcmFee).toHaveBeenCalled();
    });
  });

  describe('getXcmFeeEstimate', () => {
    it('delegates to builder.getXcmFeeEstimate', async () => {
      const res = await service.getXcmFeeEstimate(xTransferDto);
      expect(res).toBe(feeResult);
      expect(builderMock.getXcmFeeEstimate).toHaveBeenCalled();
    });
  });

  describe('generateBatchXcmCall', () => {
    it('should generate batch XCM call for valid transfers', async () => {
      const from: TNode = 'Acala';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';

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
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(2);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should generate batch XCM call for valid transfers', async () => {
      const from: TNode = 'Acala';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';

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
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
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
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
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

    it('should throw BadRequestException when transfers have different from nodes', async () => {
      const from1: TNode = 'Acala';
      const from2: TNode = 'Basilisk';
      const to: TNode = 'Moonriver';

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

    it('should throw BadRequestException for invalid from node', async () => {
      const to: TNode = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from: invalidNode,
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

    it('should throw BadRequestException for invalid to node', async () => {
      const from: TNode = 'Acala';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to: invalidNode,
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
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

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
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';
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
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

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

    it('should throw BadRequestException when toNode is an object', async () => {
      const from: TNode = 'Acala';
      const toNode = { some: 'object' }; // Invalid toNode

      const batchDto = {
        transfers: [
          {
            from,
            to: toNode,
            address,
            currency,
          },
        ],
      } as unknown as BatchXTransferDto;

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid transferToNode in transfers', async () => {
      const from: TNode = 'Acala';
      const invalidToNode = 'InvalidNode';

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
            to: invalidToNode, // Invalid to node
            address,
            currency,
          },
        ],
      };

      await expect(service.generateBatchXcmCall(batchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate batch XCM call for transfers with only fromNode (parachain to relaychain)', async () => {
      const from: TNode = 'Acala';

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
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(1);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should apply xcmVersion if provided in transfer', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

      const batchDto: BatchXTransferDto = {
        transfers: [
          {
            from,
            to,
            address,
            currency,
            xcmVersion: paraspellSdk.Version.V2,
          },
        ],
      };

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(txHashBatch);
      expect(builderMock.xcmVersion).toHaveBeenCalledWith(
        paraspellSdk.Version.V2,
      );
    });

    it('should throw BadRequestException when pallet or method not provided', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

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
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

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
});
