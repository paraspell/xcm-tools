import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuotedAmount } from './getQuotedAmount';
import { transformMultiLocation } from '../utils/transformMultiLocation';
import BigNumber from 'bignumber.js';
import type { ApiPromise } from '@polkadot/api';
import type { TMultiLocation } from '@paraspell/sdk-pjs';

describe('getQuotedAmount', () => {
  let api: ApiPromise;
  let quotePriceExactTokensForTokens: ReturnType<typeof vi.fn>;
  const assetFromML: TMultiLocation = { parents: 0, interior: 'Here' };
  const assetToML: TMultiLocation = { parents: 0, interior: 'Here' };
  const amountIn = new BigNumber('1000');

  beforeEach(() => {
    quotePriceExactTokensForTokens = vi.fn();
    api = {
      call: {
        assetConversionApi: {
          quotePriceExactTokensForTokens,
        },
      },
    } as unknown as ApiPromise;
  });

  it('should return on first valid strategy', async () => {
    const validQuoted = {
      toJSON: () => 1,
      toString: () => '2000',
    };
    quotePriceExactTokensForTokens.mockResolvedValueOnce(validQuoted);

    const result = await getQuotedAmount(api, assetFromML, assetToML, amountIn, true);

    expect(result).toEqual({
      amountOut: BigInt('2000'),
      usedFromML: assetFromML,
      usedToML: assetToML,
    });
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledTimes(1);
    expect(quotePriceExactTokensForTokens).toHaveBeenCalledWith(
      assetFromML,
      assetToML,
      amountIn.toString(),
      true,
    );
  });

  it('should try subsequent strategies if first fails', async () => {
    quotePriceExactTokensForTokens.mockRejectedValueOnce(new Error('Error 1'));
    const invalidQuoted = {
      toJSON: () => null,
      toString: () => '0',
    };
    quotePriceExactTokensForTokens.mockResolvedValueOnce(invalidQuoted);
    const validQuoted = {
      toJSON: () => 1,
      toString: () => '3000',
    };
    quotePriceExactTokensForTokens.mockResolvedValueOnce(validQuoted);

    const result = await getQuotedAmount(api, assetFromML, assetToML, amountIn, false);
    expect(result).toEqual({
      amountOut: BigInt('3000'),
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
    const validQuoted = {
      toJSON: () => 1,
      toString: () => '4000',
    };
    quotePriceExactTokensForTokens.mockResolvedValueOnce(validQuoted);
    const includeFee = true;

    await getQuotedAmount(api, assetFromML, assetToML, amountIn, includeFee);

    expect(quotePriceExactTokensForTokens).toHaveBeenCalledWith(
      assetFromML,
      assetToML,
      amountIn.toString(),
      includeFee,
    );
  });
});
