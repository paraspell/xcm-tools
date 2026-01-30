import { BadRequestException } from '@nestjs/common';
import {
  getBalance,
  getExistentialDeposit,
  InvalidAddressError,
  InvalidCurrencyError,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BalanceService } from './balance.service.js';
import type { BalanceDto } from './dto/BalanceForeignDto.js';
import type { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getBalance: vi.fn(),
    getExistentialDeposit: vi.fn(),
    CHAIN_NAMES_DOT_KSM: ['valid-chain'],
    CHAINS_WITH_RELAY_CHAINS: ['valid-chain'],
    CHAINS_WITH_RELAY_CHAINS_DOT_KSM: ['valid-chain'],
  };
});

vi.mock('../utils');

describe('BalanceService', () => {
  let service: BalanceService;

  beforeEach(() => {
    service = new BalanceService();
  });

  describe('getBalance', () => {
    it('should return asset balance as a string for a valid chain', async () => {
      const validChain = 'valid-chain';
      const params: BalanceDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const mockBalance = 500n;

      vi.mocked(getBalance).mockResolvedValue(mockBalance);

      const result = await service.getBalance(validChain, params);

      expect(getBalance).toHaveBeenCalledWith({
        address: params.address,
        currency: params.currency,
        chain: validChain,
      });
      expect(result).toEqual(mockBalance.toString());
    });

    it('should throw BadRequestException for InvalidCurrencyError', async () => {
      const validChain = 'valid-chain';
      const params: BalanceDto = {
        address: '0x1234567890',
        currency: { symbol: 'INVALID_CURRENCY_XYZ' },
      };

      vi.mocked(getBalance).mockRejectedValue(
        new InvalidCurrencyError('Invalid currency'),
      );

      await expect(service.getBalance(validChain, params)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for InvalidAddressError', async () => {
      const validChain = 'valid-chain';
      const params: BalanceDto = {
        address: 'invalid-address',
        currency: { symbol: 'UNQ' },
      };

      vi.mocked(getBalance).mockRejectedValue(
        new InvalidAddressError('Invalid address'),
      );

      await expect(service.getBalance(validChain, params)).rejects.toThrow(
        BadRequestException,
      );
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

    it('should throw BadRequestException for InvalidCurrencyError', () => {
      const validChain = 'valid-chain';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'INVALID_CURRENCY_XYZ' },
      };

      vi.mocked(getExistentialDeposit).mockImplementation(() => {
        throw new InvalidCurrencyError('Invalid currency');
      });

      expect(() => service.getExistentialDeposit(validChain, params)).toThrow(
        BadRequestException,
      );
    });
  });
});
