import { expect, Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import {
  getRelayChainSymbol,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNode,
  determineRelayChain,
} from '@paraspell/sdk';

const performTransferInfoTest = async (
  page: Page,
  fromNode: string,
  destinationNode: string,
  useApi: boolean,
) => {
  await page.getByTestId('select-origin').click();
  await page.getByRole('option', { name: fromNode, exact: true }).click();

  await page.getByTestId('select-destination').click();
  await page
    .getByRole('option', { name: destinationNode, exact: true })
    .click();

  const isNotParaToPara =
    fromNode === 'Polkadot' ||
    fromNode === 'Kusama' ||
    destinationNode === 'Polkadot' ||
    destinationNode === 'Kusama';
  if (!isNotParaToPara) {
    const randomCurrencySymbol = getRelayChainSymbol(fromNode as TNode);
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

  NODES_WITH_RELAY_CHAINS_DOT_KSM.slice(0.5).map((fromNode) => {
    const destinationNode =
      determineRelayChain(fromNode) === 'Polkadot' ? 'Astar' : 'Basilisk';
    [false, true].map((useApi) => {
      const apiLabel = useApi ? ' - API' : '';
      basePjsTest(
        `Should succeed for transfer info from ${fromNode} to ${destinationNode}${apiLabel}`,
        async () => {
          await performTransferInfoTest(
            appPage,
            fromNode,
            destinationNode,
            useApi,
          );
        },
      );
    });
  });
});
