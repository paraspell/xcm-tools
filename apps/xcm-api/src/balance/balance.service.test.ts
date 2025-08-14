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
    CHAIN_NAMES_DOT_KSM: ['valid-chain'],
    CHAINS_WITH_RELAY_CHAINS: ['valid-chain'],
    CHAINS_WITH_RELAY_CHAINS_DOT_KSM: ['valid-chain'],
  };
});

vi.mock('../utils', () => ({
  validateChain: vi.fn(),
}));

describe('BalanceService', () => {
  let service: BalanceService;

  beforeEach(() => {
    service = new BalanceService();
  });

  describe('getBalanceNative', () => {
    it('should return native balance for a valid chain', async () => {
      const validChain = 'valid-chain';
      const params: BalanceNativeDto = { address: '0x1234567890' };
      const mockBalance = 1000n;

      vi.mocked(getBalanceNative).mockResolvedValue(mockBalance);

      const result = await service.getBalanceNative(validChain, params);

      expect(getBalanceNative).toHaveBeenCalledWith({
        address: params.address,
        chain: validChain,
      });
      expect(result).toEqual(mockBalance);
    });
  });

  describe('getBalanceForeign', () => {
    it('should return foreign balance as a string for a valid chain', async () => {
      const validChain = 'valid-chain';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockBalance = 500n;

      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const result = await service.getBalanceForeign(validChain, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        chain: validChain,
        currency: params.currency,
      });
      expect(result).toEqual(mockBalance.toString());
    });

    it('should return "null" if foreign balance is null', async () => {
      const validChain = 'valid-chain';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalanceForeign).mockResolvedValue(0n);

      const result = await service.getBalanceForeign(validChain, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        chain: validChain,
        currency: params.currency,
      });
      expect(result).toEqual('0');
    });

    it('should throw BadRequestException for error inside SDK', async () => {
      const validChain = 'valid-chain';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalanceForeign).mockRejectedValue(
        new InvalidAddressError('Invalid address'),
      );

      await expect(
        service.getBalanceForeign(validChain, params),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAssetBalance', () => {
    it('should throw BadRequestException for an invalid chain', async () => {
      const invalidChain = 'invalid-chain';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      await expect(
        service.getBalanceForeign(invalidChain, params),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return foreign balance as a string for a valid chain', async () => {
      const validChain = 'valid-chain';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockBalance = 500n;

      vi.mocked(getBalanceForeign).mockResolvedValue(mockBalance);

      const result = await service.getBalanceForeign(validChain, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        chain: validChain,
        currency: params.currency,
      });
      expect(result).toEqual(mockBalance.toString());
    });

    it('should return "null" if foreign balance is null', async () => {
      const validChain = 'valid-chain';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalanceForeign).mockResolvedValue(0n);

      const result = await service.getBalanceForeign(validChain, params);

      expect(getBalanceForeign).toHaveBeenCalledWith({
        address: params.address,
        chain: validChain,
        currency: params.currency,
      });
      expect(result).toEqual('0');
    });
  });

  describe('getExistentialDeposit', () => {
    it('should return existential deposit for a valid chain', () => {
      const validChain = 'valid-chain';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const edMock = 1000000000n;

      vi.mocked(getExistentialDeposit).mockReturnValue(edMock);

      const result = service.getExistentialDeposit(validChain, params);

      expect(getExistentialDeposit).toHaveBeenCalledWith(
        validChain,
        params.currency,
      );
      expect(result).toEqual(edMock);
    });
  });
});
