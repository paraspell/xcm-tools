import { expect, Page } from '@playwright/test';

import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import {
  enableApiMode,
  selectSdkCurrency,
  selectSdkDestination,
} from './utils/sdkForm';
import { createName } from './utils/selectorName';
import { TEST_SS58_ADDRESS } from './utils/testData';

const testData = [
  {
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    currency: 'ASTR - Native',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    currency: 'KSM - Native',
  },
  {
    fromChain: 'Astar',
    toChain: 'Unique',
    currency: 'USDT - 4294969280',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'Basilisk',
    currency: 'KSM - Native',
  },
  {
    fromChain: 'Hydration',
    toChain: 'Acala',
    currency: 'HDX - Native',
  },
  {
    fromChain: 'Crust',
    toChain: 'Acala',
    currency: 'CRU - Native',
  },
];

const performTransferInfoTest = async (
  page: Page,
  fromChain: string,
  destChain: string,
  currency: string,
  useApi: boolean,
) => {
  await page.getByTestId('select-origin').fill(fromChain);
  await page.getByRole('option', { name: createName(fromChain) }).click();

  await selectSdkDestination(page, destChain);
  await selectSdkCurrency(page, currency);
  await page.getByTestId('input-address').fill(TEST_SS58_ADDRESS);
  await page.getByTestId('input-amount-0').fill('10');

  await enableApiMode(page, useApi);

  await page.getByTestId('btn-actions').click();
  await page.getByTestId('menu-item-transfer-info').click();

  await page.waitForTimeout(10000);

  const error = page.getByTestId('error');
  await expect(
    error,
    (await error.isVisible()) ? await error.innerText() : '',
  ).not.toBeVisible();
  await expect(page.getByTestId('output')).toBeVisible();
};

basePjsTest.describe('XCM SDK - Transfer Info', () => {
  let appPage: Page;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto('/xcm-sdk/utils');
  });

  testData.forEach(({ fromChain, toChain, currency }) => {
    [false, true].forEach((useApi) => {
      const apiLabel = useApi ? ' - API' : '';
      basePjsTest(
        `Should succeed for transfer info from ${fromChain} to ${toChain}${apiLabel}`,
        async () => {
          await performTransferInfoTest(appPage, fromChain, toChain, currency, useApi);
        },
      );
    });
  });
});
