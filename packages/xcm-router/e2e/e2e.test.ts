import { describe, expect, it } from 'vitest';
import { RouterBuilder } from '../src';

const MOCK_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

describe.sequential('E2E tests', () => {
  describe('AcalaDex', () => {
    it('should build a transfer extrinsic without error for DOT to ACA on AcalaDex', async () => {
      const hashes = await RouterBuilder()
        .from('Polkadot')
        .exchange('AcalaDex')
        .to('Astar')
        .currencyFrom({ symbol: 'DOT' })
        .currencyTo({ symbol: 'ACA' })
        .amount('5000000000')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });

    it('should build a transfer extrinsic without error for KSM to BNC on KaruraDex', async () => {
      const hashes = await RouterBuilder()
        .from('Kusama')
        .exchange('KaruraDex')
        .to('BifrostKusama')
        .currencyFrom({ symbol: 'KSM' })
        .currencyTo({ symbol: 'BNC' })
        .amount('22000000000000')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });
  });

  describe('BifrostDex', () => {
    it('should build a transfer extrinsic without error on Bifrost Polkadot', async () => {
      const hashes = await RouterBuilder()
        .from('Hydration')
        .exchange('BifrostPolkadotDex')
        .to('Acala')
        .currencyFrom({ symbol: 'BNC' })
        .currencyTo({ symbol: 'DOT' })
        .amount('100000000000000')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });

    it('should build a transfer extrinsic without error on Bifrost Kusama', async () => {
      const hashes = await RouterBuilder()
        .from('Kusama')
        .exchange('BifrostKusamaDex')
        .to('Karura')
        .currencyFrom({ symbol: 'KSM' })
        .currencyTo({ symbol: 'KAR' })
        .amount('100000000000000')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });
  });

  describe('HydrationDex', () => {
    it('should build a transfer extrinsic without error on Hydration', async () => {
      const hashes = await RouterBuilder()
        .from('Astar')
        .exchange('HydrationDex')
        .to('BifrostPolkadot')
        .currencyFrom({ symbol: 'ASTR' })
        .currencyTo({ symbol: 'BNC' })
        .amount('38821036538894063687')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });
  });

  describe('InterlayDex', () => {
    it('should build a transfer extrinsic without error on Interlay', async () => {
      const hashes = await RouterBuilder()
        .from('Polkadot')
        .exchange('InterlayDex')
        .to('Acala')
        .currencyFrom({ symbol: 'DOT' })
        .currencyTo({ symbol: 'INTR' })
        .amount('5000000000')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });

    it('should build a transfer extrinsic without error on Kintsugi', async () => {
      const hashes = await RouterBuilder()
        .from('Kusama')
        .exchange('KintsugiDex')
        .to('Karura')
        .currencyFrom({ symbol: 'KSM' })
        .currencyTo({ symbol: 'KINT' })
        .amount('5000000000')
        .injectorAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('0.01')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(3);
    });
  });
});
