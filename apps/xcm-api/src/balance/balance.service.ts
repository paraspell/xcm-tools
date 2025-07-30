import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getAssetBalance,
  getBalanceForeign,
  getBalanceNative,
  getExistentialDeposit,
  CHAIN_NAMES_DOT_KSM,
  CHAINS_WITH_RELAY_CHAINS,
  CHAINS_WITH_RELAY_CHAINS_DOT_KSM,
  TChainDotKsmWithRelayChains,
  TChainPolkadotKusama,
  TChainWithRelayChains,
} from '@paraspell/sdk';

import { handleXcmApiError } from '../utils/error-handler.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

@Injectable()
export class BalanceService {
  getBalanceNative(chain: string, { address, currency }: BalanceNativeDto) {
    const chainTyped = chain as TChainDotKsmWithRelayChains;
    if (!CHAINS_WITH_RELAY_CHAINS_DOT_KSM.includes(chainTyped)) {
      throw new BadRequestException(
        `Chain ${chain} is not valid. Check docs for valid chains.`,
      );
    }

    return getBalanceNative({
      address,
      chain: chainTyped,
      currency,
    });
  }

  async getBalanceForeign(
    chain: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const chainTyped = chain as TChainPolkadotKusama;
    if (!CHAIN_NAMES_DOT_KSM.includes(chainTyped)) {
      throw new BadRequestException(
        `Chain ${chain} is not valid. Check docs for valid chains.`,
      );
    }

    try {
      const balance = await getBalanceForeign({
        address,
        currency,
        chain: chainTyped,
      });
      return balance === null ? 'null' : balance.toString();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getAssetBalance(
    chain: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const chainTyped = chain as TChainPolkadotKusama;
    if (!CHAINS_WITH_RELAY_CHAINS_DOT_KSM.includes(chainTyped)) {
      throw new BadRequestException(
        `Chain ${chain} is not valid. Check docs for valid chains.`,
      );
    }

    const balance = await getAssetBalance({
      address,
      currency,
      chain: chainTyped,
    });
    return balance === null ? 'null' : balance.toString();
  }

  getExistentialDeposit(chain: string, { currency }: ExistentialDepositDto) {
    const chainTyped = chain as TChainWithRelayChains;
    if (!CHAINS_WITH_RELAY_CHAINS.includes(chainTyped)) {
      throw new BadRequestException(
        `Chain ${chain} is not valid. Check docs for valid chains.`,
      );
    }

    return getExistentialDeposit(chainTyped, currency);
  }
}
