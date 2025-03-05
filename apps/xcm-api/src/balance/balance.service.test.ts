import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BalanceService } from './balance.service.js';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import type { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';
import {
  getBalanceForeign,
  getBalanceNative,
  getExistentialDeposit,
  getMaxForeignTransferableAmount,
  getMaxNativeTransferableAmount,
  getTransferableAmount,
  verifyEdOnDestination,
} from '@paraspell/sdk';

vi.mock('@paraspell/sdk', () => ({
  getBalanceForeign: vi.fn(),
  getBalanceNative: vi.fn(),
  getMaxForeignTransferableAmount: vi.fn(),
  getMaxNativeTransferableAmount: vi.fn(),
  getTransferableAmount: vi.fn(),
  getExistentialDeposit: vi.fn(),
  verifyEdOnDestination: vi.fn(),
  NODE_NAMES_DOT_KSM: ['valid-node'],
  NODES_WITH_RELAY_CHAINS: ['valid-node'],
  NODES_WITH_RELAY_CHAINS_DOT_KSM: ['valid-node'],
}));

describe('BalanceService', () => {
  let balanceService: BalanceService;

  beforeEach(() => {
    balanceService = new BalanceService();
  });

  describe('getBalanceNative', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };

      expect(() =>
        balanceService.getBalanceNative(invalidNode, params),
      ).toThrow(BadRequestException);
    });

    it('should return native balance for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockBalance = 1000n;

      vi.mocked(getBalanceNative).mockResolvedValue(mockBalance);

      const result = await balanceService.getBalanceNative(validNode, params);

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
        balanceService.getBalanceForeign(invalidNode, params),
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

      const result = await balanceService.getBalanceForeign(validNode, params);

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

      const result = await balanceService.getBalanceForeign(validNode, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
      });
      expect(result).toEqual('0');
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
        balanceService.getBalanceForeign(invalidNode, params),
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

      const result = await balanceService.getBalanceForeign(validNode, params);

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

      const result = await balanceService.getBalanceForeign(validNode, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
      });
      expect(result).toEqual('0');
    });
  });

  describe('getMaxNativeTransferableAmount', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };

      expect(() =>
        balanceService.getMaxNativeTransferableAmount(invalidNode, params),
      ).toThrow(BadRequestException);
    });

    it('should return max native transferable amount for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockAmount = 2000n;

      vi.mocked(getMaxNativeTransferableAmount).mockResolvedValue(mockAmount);

      const result = await balanceService.getMaxNativeTransferableAmount(
        validNode,
        params,
      );

      expect(getMaxNativeTransferableAmount).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
      });
      expect(result).toEqual(mockAmount);
    });
  });

  describe('getMaxForeignTransferableAmount', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      expect(() =>
        balanceService.getMaxForeignTransferableAmount(invalidNode, params),
      ).toThrow(BadRequestException);
    });

    it('should return max foreign transferable amount for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockAmount = 3000n;

      vi.mocked(getMaxForeignTransferableAmount).mockResolvedValue(mockAmount);

      const result = await balanceService.getMaxForeignTransferableAmount(
        validNode,
        params,
      );

      expect(getMaxForeignTransferableAmount).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        node: validNode,
      });
      expect(result).toEqual(mockAmount);
    });
  });

  describe('getTransferableAmount', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      expect(() =>
        balanceService.getTransferableAmount(invalidNode, params),
      ).toThrow(BadRequestException);
    });

    it('should return transferable amount for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockAmount = 4000n;

      vi.mocked(getTransferableAmount).mockResolvedValue(mockAmount);

      const result = await balanceService.getTransferableAmount(
        validNode,
        params,
      );

      expect(getTransferableAmount).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        node: validNode,
      });
      expect(result).toEqual(mockAmount);
    });
  });

  describe('getExistentialDeposit', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };

      expect(() =>
        balanceService.getExistentialDeposit(invalidNode, params),
      ).toThrow(BadRequestException);
    });

    it('should return existential deposit for a valid node', () => {
      const validNode = 'valid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const edMock = '1000000000';

      vi.mocked(getExistentialDeposit).mockReturnValue(edMock);

      const result = balanceService.getExistentialDeposit(validNode, params);

      expect(getExistentialDeposit).toHaveBeenCalledWith(
        validNode,
        params.currency,
      );
      expect(result).toEqual(edMock);
    });
  });

  describe('verifyEdOnDestination', () => {
    it('should throw BadRequestException for an invalid node', () => {
      const invalidNode = 'invalid-node';
      const params = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ', amount: '100' },
      };

      expect(() =>
        balanceService.verifyEdOnDestination(invalidNode, params),
      ).toThrow(BadRequestException);
    });

    it('should return true if ED is valid for a valid node', async () => {
      const validNode = 'valid-node';
      const params = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ', amount: '100' },
      };

      vi.mocked(verifyEdOnDestination).mockResolvedValue(true);

      const result = await balanceService.verifyEdOnDestination(
        validNode,
        params,
      );

      expect(verifyEdOnDestination).toHaveBeenCalledWith({
        ...params,
        node: validNode,
      });
      expect(result).toEqual(true);
    });
  });
});
