import { Injectable } from '@nestjs/common';
import { getBalance, getExistentialDeposit, TChain } from '@paraspell/sdk';

import { handleXcmApiError } from '../utils/error-handler.js';
import { BalanceDto } from './dto/BalanceForeignDto.js';
import { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

@Injectable()
export class BalanceService {
  async getBalance(chain: TChain, { address, currency }: BalanceDto) {
    try {
      const balance = await getBalance({
        address,
        currency,
        chain,
      });
      return balance === null ? 'null' : balance.toString();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  getExistentialDeposit(chain: TChain, { currency }: ExistentialDepositDto) {
    try {
      return getExistentialDeposit(chain, currency);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
