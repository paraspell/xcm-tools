import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { XTransferService } from './x-transfer.service.js';
import { PatchedXTransferDto } from './dto/XTransferDto.js';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as paraspellSdk from '@paraspell/sdk';
import {
  InvalidCurrencyError,
  TNode,
  createApiInstanceForNode,
} from '@paraspell/sdk';

const builderMock = {
  xcmVersion: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  buildSerializedApiCall: vi.fn().mockReturnValue('serialized-api-call'),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue({
      disconnect: vi.fn(),
    }),
    Builder: vi.fn().mockImplementation(() => builderMock),
  };
});

describe('XTransferService', () => {
  let service: XTransferService;

  const amount = 100;
  const address = '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96';
  const currency = { symbol: 'DOT' };
  const serializedApiCall = 'serialized-api-call';
  const invalidNode = 'InvalidNode';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XTransferService],
    }).compile();

    service = module.get<XTransferService>(XTransferService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateXcmCall', () => {
    it('should generate XCM call for parachain to parachain transfer', async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';
      const xTransferDto: PatchedXTransferDto = {
        from,
        to,
        amount,
        address,
        currency,
      };

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toBe(serializedApiCall);
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
      expect(builderMock.from).toHaveBeenCalledWith(from);
      expect(builderMock.to).toHaveBeenCalledWith(to);
      expect(builderMock.currency).toHaveBeenCalledWith(currency);
      expect(builderMock.amount).toHaveBeenCalledWith(amount);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.buildSerializedApiCall).toHaveBeenCalled();
    });

    it('should generate XCM call for parachain to relaychain transfer', async () => {
      const from: TNode = 'Acala';

      const xTransferDto: PatchedXTransferDto = {
        from,
        amount,
        address,
        currency,
      };

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toBe(serializedApiCall);
      expect(createApiInstanceForNode).toHaveBeenCalledWith(from);
      expect(builderMock.from).toHaveBeenCalledWith(from);
      expect(builderMock.amount).toHaveBeenCalledWith(amount);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.buildSerializedApiCall).toHaveBeenCalled();
    });

    it('should generate XCM call for relaychain to parachain transfer', async () => {
      const to: TNode = 'Acala';
      const xTransferDto: PatchedXTransferDto = {
        to,
        amount,
        address,
        currency,
      };

      const result = await service.generateXcmCall(xTransferDto);

      expect(result).toBe(serializedApiCall);
      expect(createApiInstanceForNode).toHaveBeenCalledWith(to);
      expect(builderMock.to).toHaveBeenCalledWith(to);
      expect(builderMock.amount).toHaveBeenCalledWith(amount);
      expect(builderMock.address).toHaveBeenCalledWith(address);
      expect(builderMock.buildSerializedApiCall).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid from node', async () => {
      const xTransferDto: PatchedXTransferDto = {
        from: invalidNode,
        amount,
        address,
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to node', async () => {
      const xTransferDto: PatchedXTransferDto = {
        to: invalidNode,
        amount,
        address,
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when from and to node are missing', async () => {
      const xTransferDto: PatchedXTransferDto = {
        amount,
        address,
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing currency in parachain to parachain transfer', async () => {
      const xTransferDto: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount,
        address,
        currency: undefined,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid currency', async () => {
      const xTransferDto: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount,
        address,
        currency: { symbol: 'UNKNOWN' },
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        amount: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        buildSerializedApiCall: vi.fn().mockImplementation(() => {
          throw new InvalidCurrencyError('');
        }),
      };
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as paraspellSdk.GeneralBuilder,
      );

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).toHaveBeenCalled();
    });

    it('should throw InternalServerError when uknown error occures in the SDK', async () => {
      const xTransferDto: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount,
        address,
        currency,
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        amount: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        buildSerializedApiCall: vi.fn().mockImplementation(() => {
          throw new Error('Unknown error');
        }),
      };
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as paraspellSdk.GeneralBuilder,
      );

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(createApiInstanceForNode).toHaveBeenCalled();
    });

    it('should throw on invalid wallet address', async () => {
      const xTransferDto: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount,
        address: 'invalid-address',
        currency,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should specify xcm version if provided', async () => {
      const xTransferDto: PatchedXTransferDto = {
        from: 'Acala',
        to: 'AssetHubPolkadot',
        amount,
        address,
        currency,
        xcmVersion: paraspellSdk.Version.V2,
      };

      const builderMock = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        amount: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        xcmVersion: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue('serialized-api-call'),
      };
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(
        builderMock as unknown as paraspellSdk.GeneralBuilder,
      );

      await service.generateXcmCall(xTransferDto, true);

      expect(builderMock.xcmVersion).toHaveBeenCalledWith(
        paraspellSdk.Version.V2,
      );
    });
  });
});
