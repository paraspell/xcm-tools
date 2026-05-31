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

type TAssetEntry = {
  symbol: string;
  decimals: number;
  location: string;
  isNative?: boolean;
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

const fillAssetEntry = async (
  scope: Locator,
  index: number,
  { symbol, decimals, location, isNative }: TAssetEntry,
) => {
  await scope.getByPlaceholder('DOT').nth(index).fill(symbol);
  await scope.getByPlaceholder('10').nth(index).fill(String(decimals));
  await scope
    .getByPlaceholder('{ "parents": 1, "interior": "Here" }')
    .nth(index)
    .fill(location);
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
