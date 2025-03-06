import { type TMultiLocation } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type BigNumber from 'bignumber.js';

import { transformMultiLocation } from '../utils/transformMultiLocation';

export const getQuotedAmount = async (
  api: ApiPromise,
  assetFromML: TMultiLocation,
  assetToML: TMultiLocation,
  amountIn: BigNumber,
  includeFee = false,
) => {
  const strategies = [
    { from: assetFromML, to: assetToML, desc: 'original' },
    { from: transformMultiLocation(assetFromML), to: assetToML, desc: 'transformed assetFrom' },
    { from: assetFromML, to: transformMultiLocation(assetToML), desc: 'transformed assetTo' },
    {
      from: transformMultiLocation(assetFromML),
      to: transformMultiLocation(assetToML),
      desc: 'both transformed',
    },
  ];

  for (const strat of strategies) {
    try {
      const quoted = await api.call.assetConversionApi.quotePriceExactTokensForTokens(
        strat.from,
        strat.to,
        amountIn.toString(),
        includeFee,
      );

      if (quoted.toJSON() !== null)
        return { amountOut: BigInt(quoted.toString()), usedFromML: strat.from, usedToML: strat.to };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error (${strat.desc}):`, error);
    }
  }
  throw new Error('Swap failed: Pool not found');
};
