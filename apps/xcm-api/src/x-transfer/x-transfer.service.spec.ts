import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { XTransferService } from './x-transfer.service.js';
import { XTransferDto } from './dto/XTransferDto.js';
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
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
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
      const xTransferDto: XTransferDto = {
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

      const xTransferDto: XTransferDto = {
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
      const xTransferDto: XTransferDto = {
        to,
        amount,
        address,
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
      const xTransferDto: XTransferDto = {
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
      const xTransferDto: XTransferDto = {
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
      const xTransferDto: XTransferDto = {
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
      const xTransferDto: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount,
        address,
      };

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid currency', async () => {
      const xTransferDto: XTransferDto = {
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
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(builderMock as any);

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createApiInstanceForNode).toHaveBeenCalled();
    });

    it('should throw InternalServerError when uknown error occures in the SDK', async () => {
      const xTransferDto: XTransferDto = {
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
      vi.spyOn(paraspellSdk, 'Builder').mockReturnValue(builderMock as any);

      await expect(service.generateXcmCall(xTransferDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(createApiInstanceForNode).toHaveBeenCalled();
    });
  });
});
