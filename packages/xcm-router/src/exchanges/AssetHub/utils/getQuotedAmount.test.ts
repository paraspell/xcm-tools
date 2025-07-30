import type { TPapiApi } from '@paraspell/sdk';
import { localizeLocation, type TLocation, transform } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getQuotedAmount } from './getQuotedAmount';

vi.mock('@paraspell/sdk', async (importActual) => {
  const actual = await importActual<typeof import('@paraspell/sdk')>();
  return {
    ...actual,
    transform: vi.fn(),
    localizeLocation: vi.fn(),
  };
});

describe('getQuotedAmount', () => {
  let api: TPapiApi;
  let quotePriceExactTokensForTokens: ReturnType<typeof vi.fn>;
  const mockChain = 'AssetHubPolkadot';
  const assetFromML: TLocation = { parents: 0, interior: 'Here' };
  const assetToML: TLocation = { parents: 0, interior: 'Here' };
  const amountIn = BigNumber('1000');

  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.mocked(localizeLocation).mockImplementation((_, ml) => ml);
  });

  it('should return quoted amount with localized locations', async () => {
    quotePriceExactTokensForTokens.mockResolvedValueOnce(2000n);

    const result = await getQuotedAmount(api, mockChain, assetFromML, assetToML, amountIn, true);

    expect(localizeLocation).toHaveBeenCalledWith(mockChain, assetFromML);
    expect(localizeLocation).toHaveBeenCalledWith(mockChain, assetToML);

    expect(transform).toHaveBeenCalledWith(assetFromML);
    expect(transform).toHaveBeenCalledWith(assetToML);

    expect(quotePriceExactTokensForTokens).toHaveBeenCalledWith(
      assetFromML,
      assetToML,
      BigInt(amountIn.toString()),
      true,
    );

    expect(result).toEqual({
      amountOut: 2000n,
      usedFromML: assetFromML,
      usedToML: assetToML,
    });
  });

  it('should throw if quoting fails', async () => {
    quotePriceExactTokensForTokens.mockRejectedValueOnce(new Error('API failed'));

    await expect(getQuotedAmount(api, mockChain, assetFromML, assetToML, amountIn)).rejects.toThrow(
      'Swap failed: Pool not found',
    );

    expect(localizeLocation).toHaveBeenCalledTimes(2);
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledTimes(1);
  });

  it('should respect includeFee parameter', async () => {
    quotePriceExactTokensForTokens.mockResolvedValueOnce(3000n);
    const includeFee = false;

    await getQuotedAmount(api, mockChain, assetFromML, assetToML, amountIn, includeFee);

    expect(quotePriceExactTokensForTokens).toHaveBeenCalledWith(
      assetFromML,
      assetToML,
      BigInt(amountIn.toString()),
      includeFee,
    );
  });
});
