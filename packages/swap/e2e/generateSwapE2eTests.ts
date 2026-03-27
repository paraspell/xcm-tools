import type { GeneralBuilder, TApiOrUrl, TBuilderOptions } from '@paraspell/sdk-core';
import { describe, expect, it } from 'vitest';

const MOCK_ADDRESS = '23hBHVjKq6bRNL3FoYeq7ugZnvVcgjTaoUoWXcKPaNSgxAR3';

export const generateSwapE2eTests = <TApi, TRes, TSigner>(
  Builder: (api?: TBuilderOptions<TApiOrUrl<TApi>>) => GeneralBuilder<TApi, TRes, TSigner>,
) => {
  describe.sequential('Swap - e2e', () => {
    describe('AcalaDex', () => {
      it('should build a swap extrinsic without error for DOT to ACA on AcalaDex', async () => {
        const txs = await Builder()
          .from('Hydration')
          .to('Astar')
          .currency({ symbol: 'DOT', amount: 5 })
          .sender('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
          .recipient('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
          .swap({ currencyTo: { symbol: 'ACA' }, exchange: 'AcalaDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });

      it('should build a swap extrinsic without error for DOT to ACA (specified by location) on AcalaDex', async () => {
        const txs = await Builder()
          .from('Hydration')
          .to('Astar')
          .currency({ symbol: 'DOT', amount: 400 })
          .sender('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
          .recipient('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
          .swap({
            currencyTo: {
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
            },
            exchange: 'AcalaDex',
          })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });

      it('should build a swap extrinsic without error for ACA to DOT (specified by location) on AcalaDex', async () => {
        const txs = await Builder()
          .from('Acala')
          .to('Astar')
          .currency({
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
            amount: 500,
          })
          .sender('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
          .recipient('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
          .swap({ currencyTo: { symbol: 'DOT' }, exchange: 'AcalaDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });

      it('should build a swap extrinsic without error for DOT to ACA on AcalaDex - 1 signature', async () => {
        const txs = await Builder()
          .from('Acala')
          .to('Astar')
          .currency({ symbol: 'DOT', amount: 500 })
          .sender('23hBHVjKq6bRNL3FoYeq7ugZnvVcgjTaoUoWXcKPaNSgxAR3')
          .recipient('YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg')
          .swap({ currencyTo: { symbol: 'ACA' }, exchange: 'AcalaDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });

      it('should build a swap extrinsic without error for KSM to BNC on KaruraDex', async () => {
        const txs = await Builder()
          .from('Basilisk')
          .to('BifrostKusama')
          .currency({ symbol: 'KSM', amount: 2200 })
          .sender('FPuDZQ6kmbc7roYZHce6hZAd3MGFGRRHxNTc9AysXgnhTjh')
          .recipient('13pahaKHzBr9ojzckDrbLu2KL54g8uANv5GCNmtNwpVp8ugq')
          .swap({ currencyTo: { symbol: 'BNC' }, exchange: 'KaruraDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });
    });

    describe('BifrostDex', () => {
      it('should build a swap extrinsic without error on Bifrost Polkadot', async () => {
        const txs = await Builder()
          .from('Hydration')
          .to('Acala')
          .currency({ symbol: 'BNC', amount: 100 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { symbol: 'DOT' }, exchange: 'BifrostPolkadotDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });

      it('should build a swap extrinsic without error on Bifrost Kusama', async () => {
        const txs = await Builder()
          .from('Kusama')
          .to('Karura')
          .currency({ symbol: 'KSM', amount: 100 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { symbol: 'KAR' }, exchange: 'BifrostKusamaDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });
    });

    describe('HydrationDex', () => {
      it('should build a swap extrinsic without error on Hydration - BNC to ASTR', async () => {
        const txs = await Builder()
          .from('Astar')
          .to('BifrostPolkadot')
          .currency({ symbol: 'BNC', amount: 300 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { symbol: 'ASTR' }, exchange: 'HydrationDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });

      it('should build a swap extrinsic without error on Hydration - USDT to DOT', async () => {
        const txs = await Builder()
          .from('AssetHubPolkadot')
          .to('Hydration')
          .currency({ id: 1984, amount: 100 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { symbol: 'DOT' }, exchange: 'HydrationDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });
    });

    describe('AssetHubDex', () => {
      it('should build a swap extrinsic without error on AssetHubPolkadot', async () => {
        const txs = await Builder()
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({
            location: {
              parents: 1,
              interior: {
                Here: null,
              },
            },
            amount: 5,
          })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { id: 1984 }, exchange: 'AssetHubPolkadotDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });

      it('should build a swap extrinsic without error on AssetHubKusama', async () => {
        const txs = await Builder()
          .from('AssetHubKusama')
          .to('AssetHubKusama')
          .currency({
            location: {
              parents: 1,
              interior: {
                Here: null,
              },
            },
            amount: 500,
          })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { id: 1984 }, exchange: 'AssetHubKusamaDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });

      it('should build a swap extrinsic without error on AssetHubPaseoDex', async () => {
        const txs = await Builder()
          .from('HydrationPaseo')
          .to('AssetHubPaseo')
          .currency({ symbol: 'PAS', amount: 100 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { id: 1984 }, exchange: 'AssetHubPaseoDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });

      it('should build a swap extrinsic without error on AssetHubWestendDex', async () => {
        const txs = await Builder()
          .from('AssetHubWestend')
          .to('AssetHubWestend')
          .currency({ id: 6, amount: 300 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { id: 10111 }, exchange: 'AssetHubWestendDex' })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(1);
      });
    });

    describe('Auto exchange selection', () => {
      it('should build a swap extrinsic without error for ACA to DOT', async () => {
        const txs = await Builder()
          .from('Astar')
          .to('Polkadot')
          .currency({ symbol: 'ACA', amount: 100 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({ currencyTo: { symbol: 'DOT' } })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });

      it('should build a swap extrinsic without error for ACA to DOT - 2 exchanges', async () => {
        const txs = await Builder()
          .from('Astar')
          .to('Polkadot')
          .currency({ symbol: 'ACA', amount: 1000 })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .swap({
            currencyTo: { symbol: 'DOT' },
            exchange: ['AcalaDex', 'HydrationDex'],
          })
          .buildAll();

        expect(txs).toBeDefined();
        expect(txs.length).toBe(2);
      });
    });
  });
};
