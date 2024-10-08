import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BalanceService } from './balance.service.js';
import {
  createApiInstanceForNode,
  getBalanceForeign,
  getBalanceNative,
} from '@paraspell/sdk';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import type { ApiPromise } from '@polkadot/api';

vi.mock('@paraspell/sdk', () => ({
  createApiInstanceForNode: vi.fn(),
  getBalanceForeign: vi.fn(),
  getBalanceNative: vi.fn(),
  NODES_WITH_RELAY_CHAINS: ['valid-node'],
}));

describe('BalanceService', () => {
  let balanceService: BalanceService;

  beforeEach(() => {
    balanceService = new BalanceService();
  });

  describe('getBalanceNative', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };

      await expect(
        balanceService.getBalanceNative(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return native balance for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockApiInstance = { disconnect: vi.fn() } as unknown as ApiPromise;
      const mockBalance = 1000n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceNative).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceNative(validNode, params);

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceNative).toHaveBeenCalledWith(
        params.address,
        validNode,
        mockApiInstance,
      );
      expect(disconnectSpy).toHaveBeenCalled();
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
      const mockApiInstance = { disconnect: vi.fn() } as unknown as ApiPromise;
      const mockBalance = 500n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceForeign(validNode, params);

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceForeign).toHaveBeenCalledWith(
        params.address,
        validNode,
        params.currency,
        mockApiInstance,
      );
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockBalance.toString());
    });

    it('should return "null" if foreign balance is null', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = { disconnect: vi.fn() } as unknown as ApiPromise;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceForeign).mockResolvedValue(null);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceForeign(validNode, params);

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceForeign).toHaveBeenCalledWith(
        params.address,
        validNode,
        params.currency,
        mockApiInstance,
      );
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual('null');
    });
  });
});
