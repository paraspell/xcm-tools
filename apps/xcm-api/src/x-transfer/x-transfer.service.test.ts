import { vi, describe, expect, it, beforeEach } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { XTransferService } from './x-transfer.service.js';
import type { XTransferDto } from './dto/XTransferDto.js';
import type { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as paraspellSdk from '@paraspell/sdk-pjs';
import * as paraspellSdkPapi from '@paraspell/sdk';
import type { TNode } from '@paraspell/sdk';
import {
  InvalidCurrencyError,
  createApiInstanceForNode,
} from '@paraspell/sdk-pjs';

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  xcmVersion: vi.fn().mockReturnThis(),
  addToBatch: vi.fn().mockReturnThis(),
  buildBatch: vi.fn().mockReturnValue('batch-transaction'),
  build: vi.fn().mockResolvedValue({
    toHex: vi.fn().mockReturnValue('hash'),
  }),
};

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue({
      disconnect: vi.fn(),
    }),
    Builder: vi.fn().mockImplementation(() => builderMock),
    getDryRun: vi.fn().mockResolvedValue('hash'),
  };
});

const papiBuilderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  xcmVersion: vi.fn().mockReturnThis(),
  addToBatch: vi.fn().mockReturnThis(),
  buildBatch: vi.fn().mockReturnValue({
    getEncodedData: vi.fn().mockResolvedValue({
      asHex: vi.fn().mockReturnValue('hash'),
    }),
  }),
  build: vi.fn().mockResolvedValue({
    getEncodedData: vi.fn().mockResolvedValue({
      asHex: vi.fn().mockReturnValue('hash'),
    }),
  }),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue({
      destroy: vi.fn(),
    }),
    Builder: vi.fn().mockImplementation(() => papiBuilderMock),
  };
});

describe('XTransferService', () => {
  let service: XTransferService;

  const address = '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96';
  const currency = { symbol: 'DOT', amount: 100 };
  const batchTransaction = 'batch-transaction';
  const invalidNode = 'InvalidNode';
  const txHash = '0x123';

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [XTransferService],
    }).compile();

    service = module.get<XTransferService>(XTransferService);
  });

  describe('generateXcmCall', () => {
    it('should generate XCM call for parachain to parachain transfer', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';
      const xTransferDto: XTransferDto = {
        from,
        to,
        address,
        currency,
      };

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toHaveProperty('toHex');
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
      expect(builderMock.from).toHaveBeenCalledWith(from);
      expect(builderMock.to).toHaveBeenCalledWith(to);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for parachain to relaychain transfer', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Polkadot',
        address,
        currency,
      };

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toHaveProperty('toHex');
      expect(createApiInstanceForNode).toHaveBeenCalledWith('Acala');
      expect(builderMock.from).toHaveBeenCalledWith('Acala');
      expect(builderMock.to).toHaveBeenCalledWith('Polkadot');
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should generate XCM call for relaychain to parachain transfer', async () => {
      const to: TNode = 'Acala';
      const xTransferDto: XTransferDto = {
        from: 'Polkadot',
        to,
        currency: { symbol: 'DOT', amount: 100 },
        address,
      };

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toHaveProperty('toHex');
      expect(createApiInstanceForNode).toHaveBeenCalledWith('Polkadot');
      expect(builderMock.from).toHaveBeenCalledWith('Polkadot');
      expect(builderMock.to).toHaveBeenCalledWith(to);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('should use papi service method if papi flag is set', async () => {
      const from: TNode = 'Acala';
      const xTransferDto: XTransferDto = {
        from,
        to: 'Astar',
        address,
        currency,
      };

      const result = await service.generateXcmCall(xTransferDto, true);

      expect(result).toBe('hash');
      expect(paraspellSdkPapi.createApiInstanceForNode).toHaveBeenCalledWith(
        from,
      );
    });

    it('should throw BadRequestException for invalid from node', async () => {
      const xTransferDto: XTransferDto = {
        from: invalidNode,
        to: 'Basilisk',
        address,
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to node', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: invalidNode,
        address,
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw IncompatibleNodesError for incompatible from and to nodes', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Moonriver',
        address,
        currency,
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockReturnValue('batch-transaction'),
        build: vi
          .fn()
          .mockRejectedValue(new InvalidCurrencyError('Incompatible nodes')),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).toHaveBeenCalled();
    });

    it('should throw InternalServerError when uknown error occures in the SDK', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address,
        currency,
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockReturnValue('batch-transaction'),
        build: vi.fn().mockRejectedValue(new Error('Unknown error')),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(createApiInstanceForNode).toHaveBeenCalled();
    });

    it('should throw on invalid wallet address', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address: 'invalid-address',
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should specify xcm version if provided', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'AssetHubPolkadot',
        address,
        currency,
        xcmVersion: paraspellSdk.Version.V2,
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue(txHash),
      };
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      await service.generateXcmCall(xTransferDto);

      expect(builderMock.xcmVersion).toHaveBeenCalledWith(
        paraspellSdk.Version.V2,
      );
    });

    it('should throw BadRequestException when assetHub address is missing', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Hydration',
        to: 'Ethereum',
        address,
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should get dry run result if isDryRun is set', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address,
        currency,
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockReturnValue('batch-transaction'),
        build: vi.fn().mockResolvedValue({
          getEncodedData: vi.fn().mockResolvedValue({
            asHex: vi.fn().mockReturnValue('hash'),
          }),
        }),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      const result = await service.generateXcmCall(xTransferDto, false, true);

      expect(result).toBe('hash');
    });

    it('should throw BadRequestException when address is missing in dry run', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        currency,
        address: {
          parents: 1,
          interior: {
            X1: [
              {
                Parachain: 1000,
              },
            ],
          },
        },
      };

      await expect(
        service.generateXcmCall(xTransferDto, false, true),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pallet or method are not provided', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address,
        currency,
        pallet: 'Balances',
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should succeed when both pallet and method are provided', async () => {
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address,
        currency,
        pallet: 'Balances',
        method: 'transfer',
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        customPallet: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue(txHash),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toBe(txHash);
      expect(builderMock.customPallet).toHaveBeenCalledWith(
        'Balances',
        'transfer',
      );
    });
  });

  describe('generateBatchXcmCall', () => {
    it('should generate batch XCM call for valid transfers', async () => {
      const from: TNode = 'Acala';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockReturnValue('batch-transaction'),
        build: vi.fn().mockReturnValue(txHash),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

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

      expect(result).toBe(batchTransaction);
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
      expect(builderMock.from).toHaveBeenCalledTimes(2);
      expect(builderMock.to).toHaveBeenCalledWith(to1);
      expect(builderMock.to).toHaveBeenCalledWith(to2);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.address).toHaveBeenCalledWith(address, undefined);
      expect(builderMock.addToBatch).toHaveBeenCalledTimes(2);
      expect(builderMock.buildBatch).toHaveBeenCalledWith(batchDto.options);
    });

    it('should generate batch XCM call for valid relay to parachain transfers', async () => {
      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockReturnValue('batch-transaction'),
        build: vi.fn().mockReturnValue(txHash),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

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

      expect(result).toBe(batchTransaction);
      expect(createApiInstanceForNode).toHaveBeenCalledWith('Polkadot');
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
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
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
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
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
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
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
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
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

    it('should use papi service method if papi flag is set', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

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

      const result = await service.generateBatchXcmCall(batchDto, true);

      expect(result).toBe('hash');
      expect(paraspellSdkPapi.createApiInstanceForNode).toHaveBeenCalledWith(
        from,
      );
    });

    it('should throw BadRequestException for invalid currency', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';
      const invalidCurrency = { symbol: 'UNKNOWN', amount: 100 };

      const builderMockWithError = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('Invalid currency');
        }),
        address: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
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
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
    });

    it('should handle unknown errors from SDK', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

      const builderMockWithError = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
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
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
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

      expect(createApiInstanceForNode).not.toHaveBeenCalled();
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

      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
    });

    it('should generate batch XCM call for transfers with only fromNode (parachain to relaychain)', async () => {
      const from: TNode = 'Acala';

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockResolvedValue('batch-transaction'),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

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

      expect(result).toBe(batchTransaction);
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
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

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockResolvedValue('batch-transaction'),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(batchTransaction);
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

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        addToBatch: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        customPallet: vi.fn().mockReturnThis(),
        buildBatch: vi.fn().mockResolvedValue('batch-transaction'),
      };

      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as ReturnType<typeof paraspellSdk.Builder>,
      );

      const result = await service.generateBatchXcmCall(batchDto);

      expect(result).toBe(batchTransaction);
      expect(builderMock.customPallet).toHaveBeenCalledWith(
        'Balances',
        'transfer',
      );
    });
  });
});
