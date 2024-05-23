import { InvalidCurrencyError, getNodeProvider } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { BN } from '@polkadot/util';
import { type TSwapResult, type TSwapOptions, type TAssetSymbols } from '../../types';
import { getAssetInfo } from './utils';
import { type ApiPromise } from '@polkadot/api';
import {
  BN_HUNDRED,
  Mangata,
  type MangataInstance,
  type MultiswapSellAsset,
} from '@mangata-finance/sdk';
import { getAllPools, routeExactIn } from './routingUtils';
import { FEE_BUFFER } from '../../consts/consts';
import BigNumber from 'bignumber.js';
import Logger from '../../Logger/Logger';

class MangataExchangeNode extends ExchangeNode {
  constructor() {
    super('Mangata');
  }

  private static readonly FIXED_FEE = 0.03 * FEE_BUFFER;

  async swapCurrency(api: ApiPromise, options: TSwapOptions): Promise<TSwapResult> {
    const { currencyFrom, currencyTo, amount, injectorAddress } = options;

    const mangata: MangataInstance = Mangata.instance([getNodeProvider(this.node)]);

    const assetFromInfo = await getAssetInfo(mangata, currencyFrom);
    const assetToInfo = await getAssetInfo(mangata, currencyTo);

    if (assetFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (assetToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const amountBN = new BigNumber(amount);
    const amountWithoutFee = amountBN
      .multipliedBy(1 - MangataExchangeNode.FIXED_FEE)
      .decimalPlaces(0);

    if (amountWithoutFee.isNegative()) {
      throw new Error(
        'The provided amount is too small to cover the fixed fees. Please provide a larger amount.',
      );
    }

    Logger.log('Original amount', amount);
    Logger.log('Amount without fee', amountWithoutFee.toString());

    const allPools = await getAllPools(mangata);
    const res = routeExactIn(
      allPools,
      assetFromInfo,
      assetToInfo,
      new BN(amountWithoutFee.toString()),
      true,
    );

    if (res.bestRoute === null || res.bestAmount === null) {
      throw new Error('Swap route is null');
    }

    const MAX_SLIPPAGE = 1;

    const minAmountOutBN = res.bestAmount.mul(new BN(100 - MAX_SLIPPAGE)).div(BN_HUNDRED);

    Logger.log('Best amount', res.bestAmount.toString());
    Logger.log('Min Amount out', minAmountOutBN.toString());

    const args: MultiswapSellAsset = {
      account: injectorAddress,
      tokenIds: res.bestRoute.map((item) => item.id),
      amount: new BN(amountWithoutFee.toString()),
      minAmountOut: minAmountOutBN,
    };
    const tx = await mangata.submitableExtrinsic.multiswapSellAsset(args);

    return {
      tx,
      amountOut: res.bestAmount.toString(),
    };
  }

  async getAssetSymbols(api: ApiPromise): Promise<TAssetSymbols> {
    const mangata: MangataInstance = Mangata.instance([getNodeProvider(this.node)]);
    const assets = await mangata.query.getAssetsInfo();
    return Object.values(assets).map((asset) => asset.symbol);
  }
}

export default MangataExchangeNode;
