import { expect, Page } from '@playwright/test';

import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { selectSdkCurrency } from './utils/sdkForm';
import { acknowledgeTransferWarningIfOpened } from './utils/transferWarningModal';
import { createName } from './utils/selectorName';

type TCurrenciesScenario = {
  fromChain: string;
  toChain: string;
  currencies: string[];
  feeAsset: string;
};

// All selected assets in a scenario must share one reserve chain
const reserveIsDestination: TCurrenciesScenario = {
  fromChain: 'BifrostPolkadot',
  toChain: 'AssetHubPolkadot',
  currencies: ['USDT - 2', 'USDC - 5'],
  feeAsset: 'USDT - 2',
};

const reserveIsOrigin: TCurrenciesScenario = {
  fromChain: 'BifrostPolkadot',
  toChain: 'Hydration',
  currencies: ['BNC - Native', 'vDOT - 0'],
  feeAsset: 'BNC - Native',
};

const reserveIsRemoteChain: TCurrenciesScenario = {
  fromChain: 'BifrostPolkadot',
  toChain: 'Hydration',
  currencies: ['USDT - 2', 'USDC - 5'],
  feeAsset: 'USDC - 5',
};

const selectTransferChain = async (
  appPage: Page,
  testId: 'select-origin' | 'select-destination',
  chain: string,
) => {
  await appPage.getByTestId(testId).fill(chain);
  await appPage.getByRole('option', { name: createName(chain) }).click();
};

const selectFeeAsset = async (appPage: Page, feeAsset: string) => {
  await appPage.getByTestId('select-fee-currency').click();
  await appPage
    .getByRole('option', { name: feeAsset, exact: true })
    .first()
    .click();
};

const fillCurrenciesTransferForm = async (
  appPage: Page,
  { fromChain, toChain, currencies, feeAsset }: TCurrenciesScenario,
) => {
  await selectTransferChain(appPage, 'select-origin', fromChain);
  await selectTransferChain(appPage, 'select-destination', toChain);

  for (let index = 0; index < currencies.length; index++) {
    if (index > 0) {
      await appPage.getByRole('button', { name: 'Add another asset' }).click();
    }

    await selectSdkCurrency(appPage, currencies[index], index);
    await appPage.getByTestId(`input-amount-${index}`).fill('10');
  }

  await selectFeeAsset(appPage, feeAsset);
};

const expectNoTransferError = async (appPage: Page) => {
  const error = appPage.getByTestId('error');
  await expect(
    error,
    (await error.isVisible()) ? await error.innerText() : '',
  ).not.toBeVisible();
};

const submitTransfer = async (
  appPage: Page,
  extensionPage: PolkadotjsExtensionPage,
) => {
  await appPage.getByTestId('submit').click();
  await acknowledgeTransferWarningIfOpened(appPage);

  await expectNoTransferError(appPage);

  await extensionPage.navigate();
  await extensionPage.isPopupOpen();
  await extensionPage.close();
  await extensionPage.close();
};

const runUtilityQuery = async (
  appPage: Page,
  parentMenu: 'Fees' | 'Amounts' | 'Info',
  action:
    | 'Get XCM Fee'
    | 'Get Origin XCM Fee'
    | 'Get Transferable Amount'
    | 'Get Min Transferable Amount'
    | 'Get Receivable Amount'
    | 'Get Transfer Info'
    | 'Verify ED on Destination',
) => {
  await appPage.getByTestId('btn-actions').click();
  await appPage
    .getByRole('menuitem', { name: parentMenu, exact: true })
    .hover();

  const actionMenuItem = appPage.getByRole('menuitem', {
    name: action,
    exact: true,
  });
  await expect(actionMenuItem).toBeVisible();
  await actionMenuItem.click();

  const output = appPage.getByTestId('output');
  await expect(output.or(appPage.getByTestId('error'))).toBeVisible();
  await expectNoTransferError(appPage);
  await expect(output).toBeVisible();
};

basePjsTest.describe('XCM SDK - Multiple currencies E2E Tests', () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto('/xcm-sdk/xcm-transfer');
  });

  basePjsTest(
    'Should succeed for transfer with assets reserved on destination BifrostPolkadot -> AssetHubPolkadot',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsDestination);
      await submitTransfer(appPage, extensionPage);
    },
  );

  basePjsTest(
    'Should succeed for transfer with assets reserved on origin BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsOrigin);
      await submitTransfer(appPage, extensionPage);
    },
  );

  basePjsTest(
    'Should succeed for transfer with assets reserved on remote chain BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await submitTransfer(appPage, extensionPage);
    },
  );

  basePjsTest(
    'Should run Get XCM Fee with multiple currencies BifrostPolkadot -> AssetHubPolkadot',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsDestination);
      await runUtilityQuery(appPage, 'Fees', 'Get XCM Fee');
    },
  );

  basePjsTest(
    'Should run Get XCM Fee with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await runUtilityQuery(appPage, 'Fees', 'Get XCM Fee');
    },
  );

  basePjsTest(
    'Should run Get Origin XCM Fee with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsOrigin);
      await runUtilityQuery(appPage, 'Fees', 'Get Origin XCM Fee');
    },
  );

  basePjsTest(
    'Should run Get Transferable Amount with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await runUtilityQuery(appPage, 'Amounts', 'Get Transferable Amount');
    },
  );

  basePjsTest(
    'Should run Get Min Transferable Amount with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await runUtilityQuery(appPage, 'Amounts', 'Get Min Transferable Amount');
    },
  );

  basePjsTest(
    'Should run Get Transfer Info with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await runUtilityQuery(appPage, 'Info', 'Get Transfer Info');
    },
  );

  basePjsTest(
    'Should run Verify ED on Destination with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await runUtilityQuery(appPage, 'Info', 'Verify ED on Destination');
    },
  );

  basePjsTest(
    'Should run Get Receivable Amount with multiple currencies BifrostPolkadot -> Hydration',
    async () => {
      await fillCurrenciesTransferForm(appPage, reserveIsRemoteChain);
      await runUtilityQuery(appPage, 'Amounts', 'Get Receivable Amount');
    },
  );
});
