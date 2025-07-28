/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TNodePolkadotKusama, TPapiApi } from '@paraspell/sdk';
import { InvalidParameterError, localizeLocation, type TLocation, transform } from '@paraspell/sdk';
import type BigNumber from 'bignumber.js';

export const getQuotedAmount = async (
  api: TPapiApi,
  chain: TNodePolkadotKusama,
  assetFromML: TLocation,
  assetToML: TLocation,
  amountIn: BigNumber,
  includeFee = true,
) => {
  try {
    const localizedFrom = localizeLocation(chain, assetFromML);
    const localizedTo = localizeLocation(chain, assetToML);

    const quoted = await api
      .getUnsafeApi()
      .apis.AssetConversionApi.quote_price_exact_tokens_for_tokens(
        transform(localizedFrom),
        transform(localizedTo),
        BigInt(amountIn.decimalPlaces(0).toString()),
        includeFee,
      );

    if (quoted !== undefined) {
      return {
        amountOut: BigInt(quoted.toString()),
        usedFromML: localizedFrom,
        usedToML: localizedTo,
      };
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error (localized):', error);
  }

  throw new InvalidParameterError('Swap failed: Pool not found');
};
