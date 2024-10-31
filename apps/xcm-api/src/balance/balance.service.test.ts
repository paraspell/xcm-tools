import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BalanceService } from './balance.service.js';
import {
  createApiInstanceForNode,
  getBalanceForeign,
  getBalanceNative,
} from '@paraspell/sdk';
import {
  createApiInstanceForNode as createApiInstanceForNodePapi,
  getBalanceNative as getBalanceNativePapi,
  getBalanceForeign as getBalanceForeignPapi,
} from '@paraspell/sdk/papi';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import type { ApiPromise } from '@polkadot/api';
import type { PolkadotClient } from 'polkadot-api';

vi.mock('@paraspell/sdk', () => ({
  createApiInstanceForNode: vi.fn(),
  getBalanceForeign: vi.fn(),
  getBalanceNative: vi.fn(),
  NODE_NAMES_DOT_KSM: ['valid-node'],
  NODES_WITH_RELAY_CHAINS: ['valid-node'],
  NODES_WITH_RELAY_CHAINS_DOT_KSM: ['valid-node'],
}));

vi.mock('@paraspell/sdk/papi', () => ({
  createApiInstanceForNode: vi.fn(),
  getBalanceForeign: vi.fn(),
  getBalanceNative: vi.fn(),
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
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };

      await expect(
        balanceService.getBalanceNativePjs(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return native balance for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;
      const mockBalance = 1000n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceNative).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceNativePjs(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceNative).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        api: mockApiInstance,
      });
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockBalance);
    });

    it('should use papi for native balance if usePapi is true', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockApiInstance = {
        destroy: vi.fn(),
      } as unknown as PolkadotClient;
      const mockBalance = 1000n;

      vi.mocked(createApiInstanceForNodePapi).mockResolvedValue(
        mockApiInstance,
      );
      vi.mocked(getBalanceNativePapi).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'destroy');

      const result = await balanceService.getBalanceNativePapi(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceNativePapi).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        api: mockApiInstance,
      });

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
        balanceService.getBalanceForeignPjs(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return foreign balance as a string for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;
      const mockBalance = 500n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceForeignPjs(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
        api: mockApiInstance,
      });
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockBalance.toString());
    });

    it('should return "null" if foreign balance is null', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceForeign).mockResolvedValue(BigInt(0));

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceForeignPjs(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
        api: mockApiInstance,
      });
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual('0');
    });

    it('should use papi for foreign balance if usePapi is true', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        destroy: vi.fn(),
      } as unknown as PolkadotClient;
      const mockBalance = 500n;

      vi.mocked(createApiInstanceForNodePapi).mockResolvedValue(
        mockApiInstance,
      );
      vi.mocked(getBalanceForeignPapi).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'destroy');

      const result = await balanceService.getBalanceForeignPapi(
        validNode,
        params,
      );

      expect(createApiInstanceForNodePapi).toHaveBeenCalledWith(validNode);
      expect(getBalanceForeignPapi).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        currency: params.currency,
        api: mockApiInstance,
      });

      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockBalance.toString());
    });
  });
});
