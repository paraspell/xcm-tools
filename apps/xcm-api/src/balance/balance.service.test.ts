import { BadRequestException } from '@nestjs/common';
import {
  getBalanceForeign,
  getBalanceNative,
  getExistentialDeposit,
  InvalidAddressError,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BalanceService } from './balance.service.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getBalanceForeign: vi.fn(),
    getBalanceNative: vi.fn(),
    getExistentialDeposit: vi.fn(),
    NODE_NAMES_DOT_KSM: ['valid-node'],
    NODES_WITH_RELAY_CHAINS: ['valid-node'],
    NODES_WITH_RELAY_CHAINS_DOT_KSM: ['valid-node'],
  };
});

describe('BalanceService', () => {
  let service: BalanceService;

  beforeEach(() => {
    service = new BalanceService();
  });

  describe('getBalanceNative', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };

      expect(() => service.getBalanceNative(invalidNode, params)).toThrow(
        BadRequestException,
      );
    });

    it('should return native balance for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockBalance = 1000n;

      vi.mocked(getBalanceNative).mockResolvedValue(mockBalance);

      const result = await service.getBalanceNative(validNode, params);

      expect(getBalanceNative).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
      });
      expect(result).toEqual(mockBalance);
    });
  });

  describe('getBalanceForeign', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      await expect(
        service.getBalanceForeign(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return foreign balance as a string for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockBalance = 500n;

      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const result = await service.getBalanceForeign(validNode, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
      });
      expect(result).toEqual(mockBalance.toString());
    });

    it('should return "null" if foreign balance is null', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalanceForeign).mockResolvedValue(0n);

      const result = await service.getBalanceForeign(validNode, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
      });
      expect(result).toEqual('0');
    });

    it('should throw BadRequestException for error inside SDK', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalanceForeign).mockRejectedValue(
        new InvalidAddressError('Invalid address'),
      );

      await expect(
        service.getBalanceForeign(validNode, params),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAssetBalance', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      await expect(
        service.getBalanceForeign(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return foreign balance as a string for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockBalance = 500n;

      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const result = await service.getBalanceForeign(validNode, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
      });
      expect(result).toEqual(mockBalance.toString());
    });

    it('should return "null" if foreign balance is null', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalanceForeign).mockResolvedValue(0n);

      const result = await service.getBalanceForeign(validNode, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
      });
      expect(result).toEqual('0');
    });
  });

  describe('getExistentialDeposit', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };

      expect(() => service.getExistentialDeposit(invalidNode, params)).toThrow(
        BadRequestException,
      );
    });

    it('should return existential deposit for a valid node', () => {
      const validNode = 'valid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const edMock = 1000000000n;

      vi.mocked(getExistentialDeposit).mockReturnValue(edMock);

      const result = service.getExistentialDeposit(validNode, params);

      expect(getExistentialDeposit).toHaveBeenCalledWith(
        validNode,
        params.currency,
      );
      expect(result).toEqual(edMock);
    });
  });
});
