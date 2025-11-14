import { expect, Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { createName } from './utils/selectorName';

const testData = [
  {
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    currency: 'ASTR - Native',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    currency: 'USDT - 11',
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

  await page.getByTestId('select-destination').fill(destChain);
  await page.getByRole('option', { name: createName(destChain) }).click();

  await page.getByTestId('select-currency').first().click();
  await page.getByRole('option', { name: currency, exact: true }).click();

  const testAddress = '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';
  await page.getByTestId('input-address').fill(testAddress);
  await page.getByTestId('input-amount-0').fill('10');

  if (useApi) {
    await page.getByTestId('checkbox-api').click();
  }

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

  testData.map(({fromChain, toChain, currency}) => {
    [false, true].map((useApi) => {
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
