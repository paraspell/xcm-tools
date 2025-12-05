import { Injectable } from '@nestjs/common';
import {
  CHAINS,
  getBalance,
  getExistentialDeposit,
  TChain,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

@Injectable()
export class BalanceService {
  async getBalance(chain: string, { address, currency }: BalanceForeignDto) {
    validateChain(chain, CHAINS);

    try {
      const balance = await getBalance({
        address,
        currency,
        chain: chain as TChain,
      });
      return balance === null ? 'null' : balance.toString();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  getExistentialDeposit(chain: string, { currency }: ExistentialDepositDto) {
    validateChain(chain, CHAINS);
    return getExistentialDeposit(chain as TChain, currency);
  }
}
