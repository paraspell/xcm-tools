import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BalanceService } from './balance.service.js';
import {
  createApiInstanceForNode,
  getBalanceForeign,
  getBalanceNative,
  getExistentialDeposit,
  getMaxForeignTransferableAmount,
  getMaxNativeTransferableAmount,
  getTransferableAmount,
} from '@paraspell/sdk-pjs';
import {
  createApiInstanceForNode as createApiInstanceForNodePapi,
  getBalanceNative as getBalanceNativePapi,
  getBalanceForeign as getBalanceForeignPapi,
  getMaxForeignTransferableAmount as getMaxForeignTransferableAmountPapi,
  getMaxNativeTransferableAmount as getMaxNativeTransferableAmountPapi,
  getTransferableAmount as getTransferableAmountPapi,
  getExistentialDeposit as getExistentialDepositPapi,
} from '@paraspell/sdk';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import type { ApiPromise } from '@polkadot/api';
import type { PolkadotClient } from 'polkadot-api';
import type { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

vi.mock('@paraspell/sdk-pjs', () => ({
  createApiInstanceForNode: vi.fn(),
  getBalanceForeign: vi.fn(),
  getBalanceNative: vi.fn(),
  getMaxForeignTransferableAmount: vi.fn(),
  getMaxNativeTransferableAmount: vi.fn(),
  getTransferableAmount: vi.fn(),
  getExistentialDeposit: vi.fn(),
  NODE_NAMES_DOT_KSM: ['valid-node'],
  NODES_WITH_RELAY_CHAINS: ['valid-node'],
  NODES_WITH_RELAY_CHAINS_DOT_KSM: ['valid-node'],
}));

vi.mock('@paraspell/sdk', () => ({
  createApiInstanceForNode: vi.fn(),
  getBalanceForeign: vi.fn(),
  getBalanceNative: vi.fn(),
  getMaxForeignTransferableAmount: vi.fn(),
  getMaxNativeTransferableAmount: vi.fn(),
  getTransferableAmount: vi.fn(),
  getExistentialDeposit: vi.fn(),
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
        balanceService.getBalanceNative(invalidNode, params),
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

      const result = await balanceService.getBalanceNative(validNode, params);

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

      const result = await balanceService.getBalanceNative(
        validNode,
        params,
        true,
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
        balanceService.getBalanceForeign(invalidNode, params),
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

      const result = await balanceService.getBalanceForeign(validNode, params);

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

      const result = await balanceService.getBalanceForeign(validNode, params);

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

      const result = await balanceService.getBalanceForeign(
        validNode,
        params,
        true,
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
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;
      const mockBalance = 500n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getBalanceForeign(validNode, params);

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

      const result = await balanceService.getBalanceForeign(validNode, params);

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
  });

  describe('getMaxNativeTransferableAmount', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };

      await expect(
        balanceService.getMaxNativeTransferableAmount(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return max native transferable amount for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;
      const mockAmount = 2000n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getMaxNativeTransferableAmount).mockResolvedValue(mockAmount);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getMaxNativeTransferableAmount(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getMaxNativeTransferableAmount).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        api: mockApiInstance,
      });
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockAmount);
    });

    it('should use papi for max native transferable amount if usePapi is true', async () => {
      const validNode = 'valid-node';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockApiInstance = {
        destroy: vi.fn(),
      } as unknown as PolkadotClient;
      const mockAmount = 2000n;

      vi.mocked(createApiInstanceForNodePapi).mockResolvedValue(
        mockApiInstance,
      );
      vi.mocked(getMaxNativeTransferableAmountPapi).mockResolvedValue(
        mockAmount,
      );

      const destroySpy = vi.spyOn(mockApiInstance, 'destroy');

      const result = await balanceService.getMaxNativeTransferableAmount(
        validNode,
        params,
        true,
      );

      expect(createApiInstanceForNodePapi).toHaveBeenCalledWith(validNode);
      expect(getMaxNativeTransferableAmountPapi).toHaveBeenCalledWith({
        address: params.address,
        node: validNode,
        api: mockApiInstance,
      });
      expect(destroySpy).toHaveBeenCalled();
      expect(result).toEqual(mockAmount);
    });
  });

  describe('getMaxForeignTransferableAmount', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      await expect(
        balanceService.getMaxForeignTransferableAmount(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return max foreign transferable amount for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;
      const mockAmount = 3000n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getMaxForeignTransferableAmount).mockResolvedValue(mockAmount);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getMaxForeignTransferableAmount(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getMaxForeignTransferableAmount).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        node: validNode,
        api: mockApiInstance,
      });
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockAmount);
    });

    it('should use papi for max foreign transferable amount if usePapi is true', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        destroy: vi.fn(),
      } as unknown as PolkadotClient;
      const mockAmount = 3000n;

      vi.mocked(createApiInstanceForNodePapi).mockResolvedValue(
        mockApiInstance,
      );
      vi.mocked(getMaxForeignTransferableAmountPapi).mockResolvedValue(
        mockAmount,
      );

      const destroySpy = vi.spyOn(mockApiInstance, 'destroy');

      const result = await balanceService.getMaxForeignTransferableAmount(
        validNode,
        params,
        true,
      );

      expect(createApiInstanceForNodePapi).toHaveBeenCalledWith(validNode);
      expect(getMaxForeignTransferableAmountPapi).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        node: validNode,
        api: mockApiInstance,
      });
      expect(destroySpy).toHaveBeenCalled();
      expect(result).toEqual(mockAmount);
    });
  });

  describe('getTransferableAmount', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      await expect(
        balanceService.getTransferableAmount(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return transferable amount for a valid node', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        disconnect: vi.fn(),
      } as unknown as ApiPromise;
      const mockAmount = 4000n;

      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiInstance);
      vi.mocked(getTransferableAmount).mockResolvedValue(mockAmount);

      const disconnectSpy = vi.spyOn(mockApiInstance, 'disconnect');

      const result = await balanceService.getTransferableAmount(
        validNode,
        params,
      );

      expect(createApiInstanceForNode).toHaveBeenCalledWith(validNode);
      expect(getTransferableAmount).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        node: validNode,
        api: mockApiInstance,
      });
      expect(disconnectSpy).toHaveBeenCalled();
      expect(result).toEqual(mockAmount);
    });

    it('should use papi for transferable amount if usePapi is true', async () => {
      const validNode = 'valid-node';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockApiInstance = {
        destroy: vi.fn(),
      } as unknown as PolkadotClient;
      const mockAmount = 4000n;

      vi.mocked(createApiInstanceForNodePapi).mockResolvedValue(
        mockApiInstance,
      );
      vi.mocked(getTransferableAmountPapi).mockResolvedValue(mockAmount);

      const destroySpy = vi.spyOn(mockApiInstance, 'destroy');

      const result = await balanceService.getTransferableAmount(
        validNode,
        params,
        true,
      );

      expect(createApiInstanceForNodePapi).toHaveBeenCalledWith(validNode);
      expect(getTransferableAmountPapi).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        node: validNode,
        api: mockApiInstance,
      });
      expect(destroySpy).toHaveBeenCalled();
      expect(result).toEqual(mockAmount);
    });
  });

  describe('getExistentialDeposit', () => {
    it('should throw BadRequestException for an invalid node', async () => {
      const invalidNode = 'invalid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };

      await expect(
        balanceService.getExistentialDeposit(invalidNode, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existential deposit for a valid node using PJS', async () => {
      const validNode = 'valid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const edMock = '1000000000';

      vi.mocked(getExistentialDeposit).mockReturnValue(edMock);

      const result = await balanceService.getExistentialDeposit(
        validNode,
        params,
      );

      expect(getExistentialDeposit).toHaveBeenCalledWith(
        validNode,
        params.currency,
      );
      expect(result).toEqual(edMock);
    });

    it('should return existential deposit for a valid node using PAPI', async () => {
      const validNode = 'valid-node';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const edMock = '1000000000';

      vi.mocked(getExistentialDepositPapi).mockReturnValue(edMock);

      const result = await balanceService.getExistentialDeposit(
        validNode,
        params,
        true,
      );

      expect(getExistentialDepositPapi).toHaveBeenCalledWith(
        validNode,
        params.currency,
      );
      expect(result).toEqual(edMock);
    });
  });
});
