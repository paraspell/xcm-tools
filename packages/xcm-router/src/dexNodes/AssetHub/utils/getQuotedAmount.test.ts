import type { TPapiApi } from '@paraspell/sdk';
import { type TMultiLocation, transform, transformMultiLocation } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getQuotedAmount } from './getQuotedAmount';

vi.mock('@paraspell/sdk', async (importActual) => {
  const actual = await importActual<typeof import('@paraspell/sdk')>();
  return {
    ...actual,
    transform: vi.fn(),
  };
});

describe('getQuotedAmount', () => {
  let api: TPapiApi;
  let quotePriceExactTokensForTokens: ReturnType<typeof vi.fn>;
  const assetFromML: TMultiLocation = { parents: 0, interior: 'Here' };
  const assetToML: TMultiLocation = { parents: 0, interior: 'Here' };
  const amountIn = BigNumber('1000');

  beforeEach(() => {
    quotePriceExactTokensForTokens = vi.fn();
    api = {
      getUnsafeApi: () => ({
        apis: {
          AssetConversionApi: {
            quote_price_exact_tokens_for_tokens: quotePriceExactTokensForTokens,
          },
        },
      }),
    } as unknown as TPapiApi;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    vi.mocked(transform).mockImplementation((ml) => ml);
  });

  it('should return on first valid strategy', async () => {
    quotePriceExactTokensForTokens.mockResolvedValueOnce(2000n);

    const result = await getQuotedAmount(api, assetFromML, assetToML, amountIn, true);

    expect(result).toEqual({
      amountOut: 2000n,
      usedFromML: assetFromML,
      usedToML: assetToML,
    });
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledTimes(1);
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledWith(
      assetFromML,
      assetToML,
      BigInt(amountIn.toString()),
      true,
    );
  });

  it('should try subsequent strategies if first fails', async () => {
    quotePriceExactTokensForTokens.mockRejectedValueOnce(new Error('Error 1'));
    quotePriceExactTokensForTokens.mockResolvedValueOnce(undefined);
    quotePriceExactTokensForTokens.mockResolvedValueOnce(3000n);

    const result = await getQuotedAmount(api, assetFromML, assetToML, amountIn, false);
    expect(result).toEqual({
      amountOut: 3000n,
      usedFromML: assetFromML,
      usedToML: transformMultiLocation(assetToML),
    });
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledTimes(3);
  });

  it('should throw an error if all strategies fail', async () => {
    quotePriceExactTokensForTokens.mockRejectedValue(new Error('Error'));

    await expect(getQuotedAmount(api, assetFromML, assetToML, amountIn)).rejects.toThrow(
      'Swap failed: Pool not found',
    );
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledTimes(4);
  });

  it('should pass the includeFee parameter as provided', async () => {
    quotePriceExactTokensForTokens.mockResolvedValueOnce(4000n);
    const includeFee = true;

    await getQuotedAmount(api, assetFromML, assetToML, amountIn, includeFee);

    expect(quotePriceExactTokensForTokens).toHaveBeenCalledWith(
      assetFromML,
      assetToML,
      BigInt(amountIn.toString()),
      includeFee,
    );
  });
});
