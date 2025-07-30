import { expect, Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import {
  getRelayChainSymbol,
  CHAINS_WITH_RELAY_CHAINS_DOT_KSM,
  TChain,
  getRelayChainOf,
} from '@paraspell/sdk';

const performTransferInfoTest = async (
  page: Page,
  fromChain: string,
  destChain: string,
  useApi: boolean,
) => {
  await page.getByTestId('select-origin').click();
  await page.getByRole('option', { name: fromChain, exact: true }).click();

  await page.getByTestId('select-destination').click();
  await page.getByRole('option', { name: destChain, exact: true }).click();

  const isNotParaToPara =
    fromChain === 'Polkadot' ||
    fromChain === 'Kusama' ||
    destChain === 'Polkadot' ||
    destChain === 'Kusama';
  if (!isNotParaToPara) {
    const randomCurrencySymbol = getRelayChainSymbol(fromChain as TChain);
    await page.getByTestId('input-currency').fill(randomCurrencySymbol ?? '');
  }

  const testAddress = '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';
  await page.getByTestId('input-address').fill(testAddress);
  await page.getByTestId('input-destination-address').fill(testAddress);
  await page.getByTestId('input-amount').fill('10000000000000000000');

  if (useApi) {
    await page.getByTestId('checkbox-api').click();
  }

  await page.getByTestId('submit').click();
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
    await appPage.goto('/xcm-sdk-sandbox');
    await appPage.getByTestId('tab-transfer-info').click();
  });

  CHAINS_WITH_RELAY_CHAINS_DOT_KSM.slice(0.5).map((fromChain) => {
    const destChain =
      getRelayChainOf(fromChain) === 'Polkadot' ? 'Astar' : 'Basilisk';
    [false, true].map((useApi) => {
      const apiLabel = useApi ? ' - API' : '';
      basePjsTest(
        `Should succeed for transfer info from ${fromChain} to ${destChain}${apiLabel}`,
        async () => {
          await performTransferInfoTest(appPage, fromChain, destChain, useApi);
        },
      );
    });
  });
});
