import { describe, expect, it } from 'vitest';

import { BestAmountOutCompatPipe } from './best-amount-out-compat.pipe.js';

describe('BestAmountOutCompatPipe', () => {
  it('should keep non-object inputs unchanged', () => {
    const pipe = new BestAmountOutCompatPipe();
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform('x')).toBe('x');
    expect(pipe.transform(123)).toBe(123);
  });

  it('should convert legacy v5-style payload into the new schema shape', () => {
    const pipe = new BestAmountOutCompatPipe();
    const out = pipe.transform({
      fromChain: 'Astar',
      toChain: 'BifrostPolkadot',
      fromAsset: 'BNC',
      toAsset: 'ASTR',
      amount: '123',
      exchange: 'HydrationDex',
    }) as any;

    expect(out.from).toBe('Astar');
    expect(out.to).toBe('BifrostPolkadot');
    expect(out.currencyFrom).toEqual({ symbol: 'BNC' });
    expect(out.currencyTo).toEqual({ symbol: 'ASTR' });
    expect(out.amount).toBe('123');
    expect(out.exchange).toBe('HydrationDex');
  });

  it('should accept legacy assets as CurrencyCore objects', () => {
    const pipe = new BestAmountOutCompatPipe();
    const out = pipe.transform({
      fromChain: 'Astar',
      toChain: 'BifrostPolkadot',
      fromAsset: { symbol: { type: 'Foreign', value: 'USDT' } },
      toAsset: { id: 123 },
      amount: '1',
    }) as any;

    expect(out.currencyFrom).toEqual({ symbol: { type: 'Foreign', value: 'USDT' } });
    expect(out.currencyTo).toEqual({ id: 123 });
  });

  it('should throw a clean 400 for unrecognized legacy asset objects', () => {
    const pipe = new BestAmountOutCompatPipe();
    expect(() =>
      pipe.transform({
        fromChain: 'Astar',
        toChain: 'BifrostPolkadot',
        fromAsset: { foo: 'bar' },
        toAsset: 'ASTR',
        amount: '1',
      }),
    ).toThrow(/fromAsset must be a symbol string/i);
  });

  it('should map statemint alias to AssetHubPolkadot', () => {
    const pipe = new BestAmountOutCompatPipe();
    const out = pipe.transform({
      fromChain: 'statemint',
      toChain: 'Astar',
      fromAsset: 'USDT',
      toAsset: 'ASTR',
      amount: '1',
    }) as any;

    expect(out.from).toBe('AssetHubPolkadot');
  });
});
