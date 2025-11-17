import { Injectable } from '@nestjs/common';
import {
  CHAINS,
  getAssetBalance,
  getBalanceForeign,
  getBalanceNative,
  getExistentialDeposit,
  TChain,
  TSubstrateChain,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

@Injectable()
export class BalanceService {
  getBalanceNative(chain: string, { address, currency }: BalanceNativeDto) {
    validateChain(chain, CHAINS);

    return getBalanceNative({
      address,
      chain: chain as TChain,
      currency,
    });
  }

  async getBalanceForeign(
    chain: string,
    { address, currency }: BalanceForeignDto,
  ) {
    validateChain(chain, CHAINS);

    try {
      const balance = await getBalanceForeign({
        address,
        currency,
        chain: chain as TSubstrateChain,
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
    validateChain(chain, CHAINS);

    const balance = await getAssetBalance({
      address,
      currency,
      chain: chain as TChain,
    });
    return balance === null ? 'null' : balance.toString();
  }

  getExistentialDeposit(chain: string, { currency }: ExistentialDepositDto) {
    validateChain(chain, CHAINS);
    return getExistentialDeposit(chain as TChain, currency);
  }
}
