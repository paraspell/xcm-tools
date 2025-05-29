/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TPapiApi } from '@paraspell/sdk';
import {
  InvalidParameterError,
  type TMultiLocation,
  transform,
  transformMultiLocation,
} from '@paraspell/sdk';
import type BigNumber from 'bignumber.js';

export const getQuotedAmount = async (
  api: TPapiApi,
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
      const quoted = await api
        .getUnsafeApi()
        .apis.AssetConversionApi.quote_price_exact_tokens_for_tokens(
          transform(strat.from),
          transform(strat.to),
          BigInt(amountIn.toString()),
          includeFee,
        );

      if (quoted !== undefined)
        return { amountOut: BigInt(quoted.toString()), usedFromML: strat.from, usedToML: strat.to };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error (${strat.desc}):`, error);
    }
  }
  throw new InvalidParameterError('Swap failed: Pool not found');
};
