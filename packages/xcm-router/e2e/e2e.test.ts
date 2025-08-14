import { describe, expect, it } from 'vitest';
import { RouterBuilder } from '../src';

const MOCK_ADDRESS = '23hBHVjKq6bRNL3FoYeq7ugZnvVcgjTaoUoWXcKPaNSgxAR3';

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
        .senderAddress('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
        .recipientAddress('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });

    it('should build a transfer extrinsic without error for DOT to ACA (specified by location) on AcalaDex', async () => {
      const hashes = await RouterBuilder()
        .from('Polkadot')
        .exchange('AcalaDex')
        .to('Astar')
        .currencyFrom({ symbol: 'DOT' })
        .currencyTo({
          location: {
            parents: 1,
            interior: {
              X2: [
                {
                  Parachain: 2000,
                },
                {
                  GeneralKey: {
                    length: 2,
                    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  },
                },
              ],
            },
          },
        })
        .amount('5000000000')
        .senderAddress('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
        .recipientAddress('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });

    it('should build a transfer extrinsic without error for ACA to DOT (specified by location) on AcalaDex', async () => {
      const hashes = await RouterBuilder()
        .from('Acala')
        .exchange('AcalaDex')
        .to('Astar')
        .currencyFrom({
          location: {
            parents: 1,
            interior: {
              X2: [
                {
                  Parachain: 2000,
                },
                {
                  GeneralKey: {
                    length: 2,
                    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  },
                },
              ],
            },
          },
        })
        .currencyTo({ symbol: 'DOT' })
        .amount('5000000000')
        .senderAddress('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
        .recipientAddress('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(1);
    });

    it('should build a transfer extrinsic without error for DOT to ACA on AcalaDex - 1 signature', async () => {
      const hashes = await RouterBuilder()
        .from('Acala')
        .exchange('AcalaDex')
        .to('Astar')
        .currencyFrom({ symbol: 'DOT' })
        .currencyTo({ symbol: 'ACA' })
        .amount('5000000000')
        .senderAddress('23hBHVjKq6bRNL3FoYeq7ugZnvVcgjTaoUoWXcKPaNSgxAR3')
        .recipientAddress('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(1);
    });

    it('should build a transfer extrinsic without error for KSM to BNC on KaruraDex', async () => {
      const hashes = await RouterBuilder()
        .from('Kusama')
        .exchange('KaruraDex')
        .to('BifrostKusama')
        .currencyFrom({ symbol: 'KSM' })
        .currencyTo({ symbol: 'BNC' })
        .amount('22000000000000')
        .senderAddress('FPuDZQ6kmbc7roYZHce6hZAd3MGFGRRHxNTc9AysXgnhTjh')
        .recipientAddress('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
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
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });

    it('should build a transfer extrinsic without error on Bifrost Kusama', async () => {
      const hashes = await RouterBuilder()
        .from('Kusama')
        .exchange('BifrostKusamaDex')
        .to('Karura')
        .currencyFrom({ symbol: 'KSM' })
        .currencyTo({ symbol: 'KAR' })
        .amount('100000000000000')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });
  });

  describe('HydrationDex', () => {
    it('should build a transfer extrinsic without error on Hydration', async () => {
      const hashes = await RouterBuilder()
        .from('Astar')
        .exchange('HydrationDex')
        .to('BifrostPolkadot')
        .currencyFrom({ symbol: 'BNC' })
        .currencyTo({ symbol: 'ASTR' })
        .amount('38821036538894063687')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });

    it('should build a transfer extrinsic without error on Hydration', async () => {
      const hashes = await RouterBuilder()
        .from('AssetHubPolkadot')
        .exchange('HydrationDex')
        .to('Hydration')
        .currencyFrom({ id: 1984 })
        .currencyTo({ symbol: 'DOT' })
        .amount('38821036538894063687')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });
  });

  describe('AssetHubDex', () => {
    it('should build a transfer extrinsic without error on AssetHubPolkadot', async () => {
      const hashes = await RouterBuilder()
        .from('Hydration')
        .exchange('AssetHubPolkadotDex')
        .currencyFrom({
          location: {
            parents: 1,
            interior: {
              Here: null,
            },
          },
        })
        .currencyTo({ id: 1984 })
        .amount('5000000000')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });

    it('should build a transfer extrinsic without error on AssetHubKusama', async () => {
      const hashes = await RouterBuilder()
        .exchange('AssetHubKusamaDex')
        .currencyFrom({
          location: {
            parents: 1,
            interior: {
              Here: null,
            },
          },
        })
        .currencyTo({ id: 1984 })
        .amount('5000000000')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(1);
    });
  });

  describe('Auto exchange selection', () => {
    it('should build a transfer extrinsic without error for DOT to ACA', async () => {
      const hashes = await RouterBuilder()
        .from('Astar')
        .to('Polkadot')
        .currencyFrom({ symbol: 'ACA' })
        .currencyTo({ symbol: 'DOT' })
        .amount('5000000000')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });

    it('should build a transfer extrinsic without error for DOT to ACA - 2 exchanges', async () => {
      const hashes = await RouterBuilder()
        .from('Astar')
        .exchange(['AcalaDex', 'HydrationDex'])
        .to('Polkadot')
        .currencyFrom({ symbol: 'ACA' })
        .currencyTo({ symbol: 'DOT' })
        .amount('1000000000')
        .senderAddress(MOCK_ADDRESS)
        .recipientAddress(MOCK_ADDRESS)
        .slippagePct('1')
        .buildTransactions();

      expect(hashes).toBeDefined();
      expect(hashes.length).toBe(2);
    });
  });
});
