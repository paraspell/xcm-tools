import path from 'path';
import { fileURLToPath } from 'url';

import { BrowserContext, chromium, expect, Page, test } from '@playwright/test';

import { MetamaskExtensionPage } from './pom';
import { TEST_MNEMONIC, TEST_SS58_ADDRESS } from './utils/testData';
import { acknowledgeTransferWarningIfOpened } from './utils/transferWarningModal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metamaskExtensionPath = path.join(
  __dirname,
  'extensions',
  'metamask-ext',
);

const metamaskAccount = {
  mnemonic: TEST_MNEMONIC,
  password: '1234qwerty',
  ethAddress: '0xbbb10bb8048630bc30c8f33c5c96ac9577990c16',
};

const TRANSFER_PAGE_URL =
  '/xcm-sdk/xcm-transfer?from=Ethereum&to=AssetHubPolkadot';

const baseUiTest = test.extend({
  context: async ({}, use) => {
    const launchOptions = {
      devtools: false,
      headless: false,
      args: [
        `--disable-extensions-except=${metamaskExtensionPath}`,
        `--load-extension=${metamaskExtensionPath}`,
      ],
    };
    const context = await chromium.launchPersistentContext('', launchOptions);
    await use(context);
  },
});

const connectMetamaskWallet = async (
  appPage: Page,
  extensionPage: MetamaskExtensionPage,
) => {
  await appPage.getByRole('main').getByTestId('btn-connect-wallet').click();
  await appPage.getByTestId('btn-wallet-type-evm').click();
  await appPage.getByRole('button', { name: 'Metamask' }).click();

  await extensionPage.page.bringToFront();
  await extensionPage.reload();
  await extensionPage.connectToTheSite();
  await appPage.waitForTimeout(2000);
  await appPage.bringToFront();
  await appPage.getByTestId('btn-account-confirm').click();
};

const setupMetamaskExtension = async (context: BrowserContext) => {
  const appPage = await context.newPage();
  await appPage.goto('/');
  await appPage.waitForTimeout(2000);
  // Close Metamask welcome page
  context.pages()[2].close();
  const extensionPage = new MetamaskExtensionPage(await context.newPage());
  await extensionPage.connectAccountByExtension(
    metamaskAccount.mnemonic,
    metamaskAccount.password,
  );

  await appPage.bringToFront();
  await appPage.goto(TRANSFER_PAGE_URL);

  await connectMetamaskWallet(appPage, extensionPage);

  return { appPage, extensionPage };
};

const ensureEthAccountSelected = async (
  appPage: Page,
  extensionPage: MetamaskExtensionPage,
) => {
  const evmAccountButton = appPage.getByTestId('btn-evm-account');
  const connectWalletButton = appPage
    .getByRole('main')
    .getByTestId('btn-connect-wallet');

  // Wait for the wallet provider to rehydrate from localStorage so we know
  // whether the EVM account button or the connect-wallet button is present.
  await Promise.race([
    evmAccountButton.waitFor({ state: 'visible', timeout: 10_000 }),
    connectWalletButton.waitFor({ state: 'visible', timeout: 10_000 }),
  ]).catch(() => undefined);

  if (await evmAccountButton.isVisible()) {
    return;
  }
  await connectMetamaskWallet(appPage, extensionPage);
};

const performTransfer = async (appPage: Page) => {
  await appPage.getByTestId('input-recipient').fill(TEST_SS58_ADDRESS);

  await appPage.getByTestId('select-currency').click();
  await appPage.getByRole('option').first().click();

  await appPage.getByTestId('submit').click();
  await acknowledgeTransferWarningIfOpened(appPage);
  const errorLocator = appPage.getByTestId('error');
  await expect(errorLocator).toBeVisible();

  const errorRegex = new RegExp(
    '(' +
      'ErrorToken .* not supported' +
      '|' +
      'Failed to validate send: ERC20 token balance insufficient for transfer.' +
      '|' +
      'Insufficient ETH balance to pay fees.' +
      '|' +
      'Beneficiary does not hold existential deposit on destination.' +
      '|' +
      'The amount transferred is greater than the users token balance.' +
      '|' +
      'The Snowbridge gateway contract needs to approved as a spender for this token and amount.' +
      ')',
  );

  await expect(errorLocator).toContainText(errorRegex);
  await expect(appPage.getByTestId('output')).not.toBeVisible();
};

baseUiTest.describe('XCM SDK - ETH Bridge', () => {
  let appPage: Page;
  let extensionPage: MetamaskExtensionPage;

  baseUiTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupMetamaskExtension(context));
  });

  baseUiTest.beforeEach(async () => {
    await appPage.goto(TRANSFER_PAGE_URL);
    await ensureEthAccountSelected(appPage, extensionPage);

    const pjsApiSelector = appPage.getByTestId('label-pjs-api').first();
    await expect(pjsApiSelector).toBeVisible();
    await pjsApiSelector.click();
  });

  baseUiTest('Should transfer from Ethereum to Polkadot - PJS', async () => {
    await performTransfer(appPage);
  });
});
