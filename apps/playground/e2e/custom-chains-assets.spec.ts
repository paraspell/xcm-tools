import { readFile } from 'node:fs/promises';

import { expect, Locator, Page } from '@playwright/test';

import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { createName } from './utils/selectorName';
import { acknowledgeTransferWarningIfOpened } from './utils/transferWarningModal';

const TRANSFER_ROUTE = '/xcm-sdk/xcm-transfer';

const DUPLICATE_LOCATION_ERROR =
  'A custom asset with this location already exists on this chain';

const SAME_LOCATION = JSON.stringify({ parents: 1, interior: 'Here' });

const DOT_LOCATION = JSON.stringify({ parents: 1, interior: { Here: null } });

const uniqueLocation = (paraId: number) =>
  JSON.stringify({ parents: 1, interior: { X1: { Parachain: paraId } } });

const seededCustomChain = (name: string, paraId: number) => ({
  [name]: {
    input: {
      paraId,
      ecosystem: 'Polkadot',
      providers: [{ name: 'Seed', endpoint: 'wss://seed.example/ws' }],
      xcmVersion: 'V5',
    },
    assetsInfo: {
      relaychainSymbol: 'DOT',
      nativeAssetSymbol: name,
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: false,
      assets: [],
    },
  },
});

type TAssetEntry = {
  symbol: string;
  decimals: number;
  location: string;
  isNative?: boolean;
  existentialDeposit?: string;
};

const selectOrigin = async (page: Page, chain: string) => {
  await page.getByTestId('select-origin').fill(chain);
  await page.getByRole('option', { name: createName(chain) }).click();
};

const openCustomAssetModal = async (page: Page): Promise<Locator> => {
  await page.getByTestId('select-currency').first().click();
  await page.getByRole('button', { name: 'Add custom asset' }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  return modal;
};

const openCustomChainModal = async (page: Page): Promise<Locator> => {
  await page.getByTestId('select-origin').click();
  await page.getByRole('button', { name: 'Add custom chain' }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  return modal;
};

const registerCustomAsset = async (page: Page, entry: TAssetEntry) => {
  const modal = await openCustomAssetModal(page);
  await fillAssetEntry(modal, 0, entry);
  await modal.getByPlaceholder('DOT').first().click();
  await modal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(modal).not.toBeVisible();
};

const seedCustomChains = async (page: Page, seed: Record<string, unknown>) => {
  await page.evaluate((value) => {
    localStorage.setItem(
      'paraspell_playground_custom_chains',
      JSON.stringify(value),
    );
  }, seed);
  await page.reload();
  await expect(page.getByTestId('select-origin')).toBeVisible();
};

const seedCustomConfig = async (
  page: Page,
  chains: Record<string, unknown>,
  assets: Record<string, unknown>,
) => {
  await page.evaluate(
    ({ chains: c, assets: a }) => {
      localStorage.setItem(
        'paraspell_playground_custom_chains',
        JSON.stringify(c),
      );
      localStorage.setItem(
        'paraspell_playground_custom_assets',
        JSON.stringify(a),
      );
    },
    { chains, assets },
  );
  await page.reload();
  await expect(page.getByTestId('select-origin')).toBeVisible();
};

const fillAssetEntry = async (
  scope: Locator,
  index: number,
  { symbol, decimals, location, isNative, existentialDeposit }: TAssetEntry,
) => {
  await scope.getByPlaceholder('DOT').nth(index).fill(symbol);
  await scope.getByPlaceholder('10').nth(index).fill(String(decimals));
  await scope
    .getByPlaceholder('{ "parents": 1, "interior": "Here" }')
    .nth(index)
    .fill(location);
  if (existentialDeposit !== undefined) {
    await scope.getByPlaceholder('0.01').nth(index).fill(existentialDeposit);
  }
  if (isNative) {
    await scope
      .getByRole('checkbox', { name: 'Native', exact: true })
      .nth(index)
      .check();
  }
};

basePjsTest.describe('Custom chains & custom assets E2E Tests', () => {
  let appPage: Page;

  basePjsTest.beforeAll(async ({ context }) => {
    appPage = await context.newPage();
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto(TRANSFER_ROUTE);
    await expect(appPage.getByTestId('select-origin')).toBeVisible();
  });

  basePjsTest(
    'Should register a custom asset and surface it in the currency picker',
    async () => {
      await selectOrigin(appPage, 'Astar');

      const modal = await openCustomAssetModal(appPage);
      await fillAssetEntry(modal, 0, {
        symbol: 'XCTEST',
        decimals: 12,
        location: SAME_LOCATION,
      });
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('XCTEST');
      await expect(
        appPage.getByRole('option', { name: /XCTEST \(custom\)/ }),
      ).toBeVisible();
    },
  );

  basePjsTest(
    'Should store a human-readable existential deposit as plancks and prefill it on edit',
    async () => {
      await selectOrigin(appPage, 'Astar');

      const modal = await openCustomAssetModal(appPage);
      await fillAssetEntry(modal, 0, {
        symbol: 'EDASSET',
        decimals: 10,
        location: uniqueLocation(2050),
        existentialDeposit: '0.01',
      });
      await modal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modal).not.toBeVisible();

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('EDASSET');
      const customOption = appPage.getByRole('option', {
        name: 'EDASSET (custom)',
      });
      await expect(customOption).toBeVisible();

      const stored = await appPage.evaluate(() =>
        JSON.parse(
          localStorage.getItem('paraspell_playground_custom_assets') ?? '{}',
        ),
      );
      const edAsset = (stored.Astar ?? []).find(
        (asset: { symbol: string }) => asset.symbol === 'EDASSET',
      );
      expect(edAsset?.existentialDeposit).toBe('100000000');

      await customOption
        .getByRole('button', { name: 'Edit custom item' })
        .click();

      const editModal = appPage.getByRole('dialog');
      await expect(editModal).toContainText('Edit custom asset');
      await expect(editModal.getByPlaceholder('0.01')).toHaveValue('0.01');
    },
  );

  basePjsTest(
    'Should block two custom assets sharing a location on the same chain',
    async () => {
      const modal = await openCustomChainModal(appPage);

      await modal.getByPlaceholder('MyChain').fill('DupLocationChain');
      await modal.getByPlaceholder('2000').fill('4242');
      await modal.getByPlaceholder('e.g. Parity').fill('Primary');
      await modal.getByPlaceholder('wss://...').fill('wss://example.com/ws');

      await modal.getByRole('button', { name: 'Add asset' }).click();
      await modal.getByRole('button', { name: 'Add asset' }).click();

      await fillAssetEntry(modal, 0, {
        symbol: 'AAA',
        decimals: 10,
        location: SAME_LOCATION,
      });
      await fillAssetEntry(modal, 1, {
        symbol: 'BBB',
        decimals: 12,
        location: SAME_LOCATION,
      });

      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(
        modal.getByText(DUPLICATE_LOCATION_ERROR).first(),
      ).toBeVisible();
      await expect(modal).toBeVisible();
    },
  );

  basePjsTest(
    'Should allow the same location across different chains',
    async () => {
      const modal = await openCustomChainModal(appPage);

      await modal.getByPlaceholder('MyChain').fill('DistinctLocationChain');
      await modal.getByPlaceholder('2000').fill('4243');
      await modal.getByPlaceholder('e.g. Parity').fill('Primary');
      await modal.getByPlaceholder('wss://...').fill('wss://example.com/ws');

      await modal.getByRole('button', { name: 'Add asset' }).click();
      await fillAssetEntry(modal, 0, {
        symbol: 'AAA',
        decimals: 10,
        location: SAME_LOCATION,
      });
      await expect(modal.getByText(DUPLICATE_LOCATION_ERROR)).toHaveCount(0);
    },
  );

  basePjsTest(
    'Should register a custom chain and surface it in the origin picker',
    async () => {
      const modal = await openCustomChainModal(appPage);

      await modal.getByPlaceholder('MyChain').fill('MyAssetHub');
      await modal.getByPlaceholder('2000').fill('1000');
      await modal.getByPlaceholder('e.g. Parity').fill('IBP');
      await modal
        .getByPlaceholder('wss://...')
        .fill('wss://polkadot-asset-hub-rpc.polkadot.io');

      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(modal).not.toBeVisible({ timeout: 60_000 });

      await appPage.getByTestId('select-origin').fill('MyAssetHub');
      await expect(
        appPage.getByRole('option', { name: createName('MyAssetHub') }),
      ).toBeVisible();
    },
  );

  basePjsTest(
    'Should edit a custom asset and reflect the new symbol in the currency picker',
    async () => {
      await selectOrigin(appPage, 'Astar');

      await registerCustomAsset(appPage, {
        symbol: 'EDITME',
        decimals: 12,
        location: uniqueLocation(2001),
      });

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('EDITME');
      const customOption = appPage.getByRole('option', {
        name: 'EDITME (custom)',
      });
      await expect(customOption).toBeVisible();
      await customOption
        .getByRole('button', { name: 'Edit custom item' })
        .click();

      const modal = appPage.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Edit custom asset');
      await expect(modal.getByPlaceholder('DOT')).toHaveValue('EDITME');
      await expect(modal.getByPlaceholder('10')).toHaveValue('12');

      await modal.getByPlaceholder('DOT').fill('EDITED');
      await modal.getByRole('button', { name: 'Save changes' }).click();
      await expect(modal).not.toBeVisible();

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('EDITED');
      await expect(
        appPage.getByRole('option', { name: /EDITED \(custom\)/ }),
      ).toBeVisible();

      await appPage.getByTestId('select-currency').first().fill('EDITME');
      await expect(
        appPage.getByRole('option', { name: /EDITME \(custom\)/ }),
      ).toHaveCount(0);
    },
  );

  basePjsTest(
    'Should remove a custom asset from the currency picker',
    async () => {
      await selectOrigin(appPage, 'Astar');

      await registerCustomAsset(appPage, {
        symbol: 'REMOVEME',
        decimals: 10,
        location: uniqueLocation(2002),
      });

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('REMOVEME');
      const customOption = appPage.getByRole('option', {
        name: 'REMOVEME (custom)',
      });
      await expect(customOption).toBeVisible();
      await customOption
        .getByRole('button', { name: 'Remove custom item' })
        .click();

      await expect(
        appPage.getByRole('option', { name: /REMOVEME \(custom\)/ }),
      ).toHaveCount(0);
    },
  );

  basePjsTest(
    'Should override a built-in asset and surface it as a custom asset',
    async () => {
      await selectOrigin(appPage, 'Astar');

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('ASTR');
      const builtInOption = appPage.getByRole('option', {
        name: 'ASTR - Native',
        exact: true,
      });
      await expect(builtInOption).toBeVisible();
      await builtInOption
        .getByRole('button', { name: 'Override asset' })
        .click();

      const modal = appPage.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Add custom asset');
      await expect(modal.getByText('Asset to override')).toBeVisible();
      await expect(modal.getByPlaceholder('DOT').first()).toHaveValue('ASTR');
      await expect(modal.getByPlaceholder('10').first()).toHaveValue('18');

      await modal.getByPlaceholder('10').first().fill('7');
      await modal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modal).not.toBeVisible();

      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('ASTR');
      await expect(
        appPage.getByRole('option', { name: 'ASTR (custom)', exact: true }),
      ).toBeVisible();
      await expect(
        appPage.getByRole('option', { name: 'ASTR - Native', exact: true }),
      ).toHaveCount(0);
    },
  );

  basePjsTest(
    'Should remove a custom chain from the origin picker',
    async () => {
      await seedCustomChains(
        appPage,
        seededCustomChain('SeedRemoveChain', 4801),
      );

      await appPage.getByTestId('select-origin').click();
      await appPage.getByTestId('select-origin').fill('SeedRemoveChain');
      const customOption = appPage.getByRole('option', {
        name: createName('SeedRemoveChain'),
      });
      await expect(customOption).toBeVisible();
      await customOption
        .getByRole('button', { name: 'Remove custom item' })
        .click();

      await expect(
        appPage.getByRole('option', { name: createName('SeedRemoveChain') }),
      ).toHaveCount(0);
    },
  );

  basePjsTest(
    'Should open a custom chain in the edit modal prefilled with its values',
    async () => {
      await seedCustomChains(appPage, seededCustomChain('SeedEditChain', 7777));

      await appPage.getByTestId('select-origin').click();
      await appPage.getByTestId('select-origin').fill('SeedEditChain');
      const customOption = appPage.getByRole('option', {
        name: createName('SeedEditChain'),
      });
      await expect(customOption).toBeVisible();
      await customOption
        .getByRole('button', { name: 'Edit custom item' })
        .click();

      const modal = appPage.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Edit custom chain');
      await expect(modal.getByPlaceholder('MyChain')).toHaveValue(
        'SeedEditChain',
      );
      await expect(modal.getByPlaceholder('2000')).toHaveValue('7777');
      await expect(modal.getByPlaceholder('wss://...')).toHaveValue(
        'wss://seed.example/ws',
      );

      await modal.getByRole('button', { name: 'Cancel' }).click();
      await expect(modal).not.toBeVisible();
    },
  );

  basePjsTest(
    'Should export custom chains and assets as a single JSON config',
    async () => {
      await seedCustomConfig(appPage, seededCustomChain('ExportChain', 5100), {
        Astar: [
          {
            symbol: 'EXPASSET',
            decimals: 8,
            location: { parents: 1, interior: { X1: { Parachain: 5101 } } },
          },
        ],
      });

      await appPage.getByTestId('advanced-options-toggle').click();

      const downloadPromise = appPage.waitForEvent('download');
      await appPage.getByTestId('button-custom-config').click();
      await appPage.getByTestId('button-export-config').click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toBe('paraspell-custom-config.json');

      const path = await download.path();
      const content = JSON.parse(await readFile(path, 'utf-8'));
      expect(content.customChains).toHaveProperty('ExportChain');
      expect(content.customAssets.Astar[0].symbol).toBe('EXPASSET');
    },
  );

  basePjsTest(
    'Should import a JSON config and surface its chains and assets',
    async () => {
      await seedCustomConfig(appPage, {}, {});

      const config = {
        version: 1,
        customChains: seededCustomChain('ImportChain', 6100),
        customAssets: {
          Astar: [
            {
              symbol: 'IMPASSET',
              decimals: 9,
              location: { parents: 1, interior: { X1: { Parachain: 6101 } } },
            },
          ],
        },
      };

      await appPage.getByTestId('advanced-options-toggle').click();
      await appPage.getByTestId('button-custom-config').click();
      await appPage.locator('input[type="file"]').setInputFiles({
        name: 'paraspell-custom-config.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(config)),
      });

      await expect(appPage.getByText('Config imported')).toBeVisible();

      await appPage.getByTestId('select-origin').click();
      await appPage.getByTestId('select-origin').fill('ImportChain');
      await expect(
        appPage.getByRole('option', { name: createName('ImportChain') }),
      ).toBeVisible();

      await selectOrigin(appPage, 'Astar');
      await appPage.getByTestId('select-currency').first().click();
      await appPage.getByTestId('select-currency').first().fill('IMPASSET');
      await expect(
        appPage.getByRole('option', { name: /IMPASSET \(custom\)/ }),
      ).toBeVisible();
    },
  );
});

basePjsTest.describe('Custom chain transfer wallet signing', () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
    await appPage.goto(TRANSFER_ROUTE);
  });

  basePjsTest(
    'Should open the wallet when transferring from a custom Bulletin chain to Polkadot',
    async () => {
      basePjsTest.setTimeout(180_000);

      const modal = await openCustomChainModal(appPage);
      await modal.getByPlaceholder('MyChain').fill('Bulletin');
      await modal.getByPlaceholder('2000').fill('1010');

      await modal.getByPlaceholder('e.g. Parity').nth(0).fill('Parity');
      await modal
        .getByPlaceholder('wss://...')
        .nth(0)
        .fill('wss://bulletin-rpc.polkadot.io');
      await modal.getByRole('button', { name: 'Add provider' }).click();
      await modal.getByPlaceholder('e.g. Parity').nth(1).fill('Spectrum');
      await modal
        .getByPlaceholder('wss://...')
        .nth(1)
        .fill(
          'wss://spectrum-03.simplystaking.xyz/cG9sa2Fkb3QtMDMtOTFkMmYwZGYtcG9sa2Fkb3Q/9QbAeudedsupNA/polkadotbulletin/mainnet/',
        );

      await modal.getByRole('button', { name: 'Add asset' }).click();
      await fillAssetEntry(modal, 0, {
        symbol: 'DOT',
        decimals: 10,
        location: DOT_LOCATION,
        isNative: true,
      });

      await modal.getByPlaceholder('MyChain').click();
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible({ timeout: 60_000 });

      await selectOrigin(appPage, 'Bulletin');
      await appPage.getByTestId('select-destination').fill('Polkadot');
      await appPage
        .getByRole('option', { name: createName('Polkadot') })
        .click();

      await appPage.getByTestId('select-currency').first().click();
      await appPage
        .getByRole('option', { name: /^DOT\b/ })
        .first()
        .click();
      await appPage.getByTestId('input-amount-0').fill('10');

      await appPage.getByTestId('submit').click();
      await acknowledgeTransferWarningIfOpened(appPage);

      const error = appPage.getByTestId('error');
      await expect(
        error,
        (await error.isVisible()) ? await error.innerText() : '',
      ).not.toBeVisible();

      await extensionPage.navigate();
      await extensionPage.isPopupOpen();
      await extensionPage.close();
      await extensionPage.close();
    },
  );
});

basePjsTest.describe('Custom chain destination transfer wallet signing', () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
    await appPage.goto(TRANSFER_ROUTE);
  });

  basePjsTest(
    'Should open the wallet when transferring from AssetHubPolkadot to a custom destination chain',
    async () => {
      basePjsTest.setTimeout(300_000);

      const modal = await openCustomChainModal(appPage);
      await modal.getByPlaceholder('MyChain').fill('CustomDestination');
      await modal.getByPlaceholder('2000').fill('2034');

      await modal.getByPlaceholder('e.g. Parity').nth(0).fill('IBP');
      await modal
        .getByPlaceholder('wss://...')
        .nth(0)
        .fill('wss://hydration.ibp.network');
      await modal.getByRole('button', { name: 'Add provider' }).click();
      await modal.getByPlaceholder('e.g. Parity').nth(1).fill('Helikon');
      await modal
        .getByPlaceholder('wss://...')
        .nth(1)
        .fill('wss://rpc.helikon.io/hydradx');

      await modal.getByRole('button', { name: 'Add asset' }).click();
      await fillAssetEntry(modal, 0, {
        symbol: 'DOT',
        decimals: 10,
        location: DOT_LOCATION,
      });

      await modal.getByPlaceholder('MyChain').click();
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible({ timeout: 60_000 });

      await selectOrigin(appPage, 'AssetHubPolkadot');

      await appPage.getByTestId('select-destination').fill('CustomDestination');
      await appPage
        .getByRole('option', { name: createName('CustomDestination') })
        .click();

      await appPage.getByTestId('select-currency').first().click();
      await appPage
        .getByRole('option', { name: /^DOT\b/ })
        .first()
        .click();
      await appPage.getByTestId('input-amount-0').fill('10');

      await appPage.getByTestId('submit').click();
      await acknowledgeTransferWarningIfOpened(appPage);

      const error = appPage.getByTestId('error');
      await expect(
        error,
        (await error.isVisible()) ? await error.innerText() : '',
      ).not.toBeVisible();

      await extensionPage.navigate();
      await extensionPage.isPopupOpen();
      await extensionPage.close();
      await extensionPage.close();
    },
  );
});

const BOMBOKLA_IMPORT_CONFIG = {
  version: 1,
  customChains: {
    Bombokla: {
      input: {
        paraId: 213489,
        ecosystem: 'Polkadot',
        providers: [
          {
            name: 'Parity',
            endpoint: 'wss://polkadot-asset-hub-rpc.polkadot.io',
          },
        ],
        xcmVersion: 'V5',
        ss58Prefix: 34,
        assets: [
          {
            symbol: 'BOMBO',
            decimals: 10,
            location: { parents: 1, interior: 'Here' },
            existentialDeposit: '100000000',
          },
        ],
        pallets: {
          nativeAssets: 'Balances',
        },
      },
      assetsInfo: {
        relaychainSymbol: 'DOT',
        nativeAssetSymbol: 'DOT',
        isEVM: false,
        ss58Prefix: 34,
        supportsDryRunApi: true,
        supportsXcmPaymentApi: true,
        assets: [
          {
            symbol: 'DOT',
            decimals: 10,
            location: {
              parents: 1,
              interior: { X1: [{ Parachain: 213489 }] },
            },
            isNative: true,
          },
          {
            symbol: 'BOMBO',
            decimals: 10,
            location: { parents: 1, interior: { Here: null } },
            existentialDeposit: '100000000',
          },
        ],
      },
    },
  },
  customAssets: {},
};

basePjsTest.describe(
  'Custom chain native existential deposit auto-fetch',
  () => {
    let appPage: Page;
    let extensionPage: PolkadotjsExtensionPage;

    basePjsTest.beforeAll(async ({ context }) => {
      ({ appPage, extensionPage } = await setupPolkadotExtension(context));
      await appPage.goto(TRANSFER_ROUTE);
    });

    basePjsTest(
      'Should auto-fetch the native ED and not throw when transferring DOT from Astar to a custom Bombokla chain',
      async () => {
        basePjsTest.setTimeout(300_000);

        await appPage.getByTestId('advanced-options-toggle').click();
        await appPage.getByTestId('button-custom-config').click();
        await appPage.locator('input[type="file"]').setInputFiles({
          name: 'paraspell-custom-config.json',
          mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify(BOMBOKLA_IMPORT_CONFIG)),
        });
        await expect(appPage.getByText('Config imported')).toBeVisible();

        await selectOrigin(appPage, 'Astar');

        await appPage.getByTestId('select-destination').fill('Bombokla');
        await appPage
          .getByRole('option', { name: createName('Bombokla') })
          .click();

        await appPage.getByTestId('select-currency').first().click();
        await appPage
          .getByRole('option', { name: /^DOT\b/ })
          .first()
          .click();
        await appPage.getByTestId('input-amount-0').fill('10');

        await appPage.getByTestId('submit').click();
        await acknowledgeTransferWarningIfOpened(appPage);

        // The bug surfaced as an error toast/box; assert it never appears
        // (in particular not the existential-deposit error).
        const error = appPage.getByTestId('error');
        await expect(
          error,
          (await error.isVisible()) ? await error.innerText() : '',
        ).not.toBeVisible();

        await extensionPage.navigate();
        await extensionPage.isPopupOpen();
        await extensionPage.close();
        await extensionPage.close();
      },
    );
  },
);
