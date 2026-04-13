/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TPapiApi } from '@paraspell/sdk';
import { transform } from '@paraspell/sdk';
import type { TParachain } from '@paraspell/sdk-core';
import { localizeLocation, RoutingResolutionError, type TLocation } from '@paraspell/sdk-core';

export const getQuotedAmount = async (
  api: TPapiApi,
  chain: TParachain,
  assetFromML: TLocation,
  assetToML: TLocation,
  amountIn: bigint,
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
        amountIn,
        includeFee,
      );

    if (quoted !== undefined) {
      return {
        amountOut: BigInt((quoted as bigint).toString()),
        usedFromML: localizedFrom,
        usedToML: localizedTo,
      };
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error (localized):', error);
  }

  throw new RoutingResolutionError('Swap failed: Pool not found');
};
