import path from 'path';
import { fileURLToPath } from 'url';

import {
  BrowserContext,
  chromium,
  expect,
  Locator,
  Page,
  test,
} from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const talismanExtensionPath = path.join(
  __dirname,
  'extensions',
  'talisman-ext',
  'apps',
  'extension',
  'dist',
  'chrome'
);

const polkaAccount = {
  mnemonic:
    'leg observe column teach until outside since school october dinner impact title',
  password: '1234qwe',
  name: 'PolkadotUser',
};

const ethAccount = {
  mnemonic:
    'clerk agree address universe square swift jealous snow reflect novel prison limit indicate bulk north purity license that possible believe digital attend pigeon doctor',
  password: '1234qwe',
  name: 'EthereumUser',
};

export const baseTalismanWithEthereumTest = test.extend<{
  extensionId: string;
  onboardedPage: Page;
  importAccounts: () => Promise<Page>;
  addNewAccount: (opts: {
    type: 'ethereum' | 'polkadot';
    name?: string;
  }) => Promise<Page>;
  walletPopup: (opts: { locator: Locator }) => Promise<Page>;
}>({
  context: async ({}, use) => {
    const launchOptions = {
      devtools: false,
      headless: false,
      args: [
        `--disable-extensions-except=${talismanExtensionPath}`,
        `--load-extension=${talismanExtensionPath}`,
      ],
    };
    const context = await chromium.launchPersistentContext('', launchOptions);
    await use(context);
  },
  extensionId: async ({ context }, utilize) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await utilize(extensionId);
  },

  onboardedPage: async ({ context, extensionId }, utilize) => {
    const page = await context.newPage();

    page.on('pageerror', (err) => {
      throw new Error('Failing test due to error in browser page: ' + err);
    });

    await page.goto(`chrome-extension://${extensionId}/onboarding.html`);
    await page.waitForTimeout(1000);

    const pages = context.pages();
    for (const p of pages) {
      if (p !== page) await p.close();
    }

    await page.getByTestId('onboarding-get-started-button').click();
    // Password validation
    await page.getByPlaceholder('Enter password').fill('12345');
    await expect(
      page.getByText('Password must be at least 6 characters long'),
    ).toBeVisible();
    await page.getByPlaceholder('Enter password').fill(ethAccount.password);
    await page
      .getByPlaceholder('Confirm password')
      .fill('wrong-confirmation-password');
    await expect(page.getByText('Passwords must match')).toBeVisible();
    await expect(
      page.getByTestId('onboarding-password-confirm-button'),
    ).toBeDisabled();
    await page.getByPlaceholder('Confirm password').fill(ethAccount.password);
    await page.getByTestId('onboarding-password-confirm-button').click();
    // accepting privacy terms
    await page.getByTestId('onboarding-privacy-accept-button').click();
    // Enter Talisman
    await page.getByTestId('onboarding-enter-talisman-button').click();
    await utilize(page);
  },

  importAccounts: async ({ onboardedPage, extensionId }, utilize) => {
    const importAccounts = async () => {
      await onboardedPage.goto(
        `chrome-extension://${extensionId}/dashboard.html#/accounts/add/mnemonic`,
      );
      await onboardedPage
        .getByTestId(`account-platform-selector-ethereum`)
        .click();
      await onboardedPage
        .getByPlaceholder('Choose a name')
        .fill(ethAccount.name);
      await onboardedPage
        .getByPlaceholder('Enter your 12 or 24 word recovery phrase')
        .fill(ethAccount.mnemonic);
      await expect(
        onboardedPage.getByTestId('account-add-mnemonic-import-button'),
      ).toBeEnabled();
      await onboardedPage
        .getByTestId('account-add-mnemonic-import-button')
        .click();
      await expect(
        onboardedPage.getByTestId('top-actions-buttons'),
      ).toBeVisible();
      expect(onboardedPage.url()).toContain('portfolio');

      await onboardedPage.goto(
        `chrome-extension://${extensionId}/dashboard.html#/accounts/add/mnemonic`,
      );
      await onboardedPage
        .getByTestId(`account-platform-selector-polkadot`)
        .click();
      await onboardedPage
        .getByPlaceholder('Choose a name')
        .fill(polkaAccount.name);
      await onboardedPage
        .getByPlaceholder('Enter your 12 or 24 word recovery phrase')
        .fill(polkaAccount.mnemonic);
      await expect(
        onboardedPage.getByTestId('account-add-mnemonic-import-button'),
      ).toBeEnabled();
      await onboardedPage
        .getByTestId('account-add-mnemonic-import-button')
        .click();
      await expect(
        onboardedPage.getByTestId('top-actions-buttons'),
      ).toBeVisible();
      expect(onboardedPage.url()).toContain('portfolio');
      return onboardedPage;
    };
    await utilize(importAccounts);
  },
});

export const setupTalismanExtension = async (
  context: BrowserContext,
  importAccounts: () => Promise<Page>
) => {
  const appPage = await context.newPage();
  await appPage.goto('/');

  const talismanExtensionPage = await importAccounts();

  const walletPopupPromise = context.waitForEvent('page');
  await appPage.getByRole('main').getByTestId('btn-connect-wallet').click();
  await appPage.getByRole('button', { name: 'Talisman' }).click();
  const walletPopup = await walletPopupPromise;

  await walletPopup.waitForLoadState('domcontentloaded');

  const checkbox = walletPopup.locator('input.form-checkbox');
  if (!(await checkbox.isChecked())) await checkbox.check();

  await walletPopup
    .getByRole('button', { name: 'Connect All', exact: true })
    .click();

  await walletPopup.getByRole('button', { name: 'Connect 2' }).click();

  await appPage.getByRole('radio', { name: 'PolkadotUser' }).click();

  await appPage.getByTestId('btn-account-confirm').click();

  return { appPage, talismanExtensionPage };
};

export const connectEVMAccount = async (appPage: Page) => {
  const walletModal = appPage.getByRole('dialog', {
    name: 'Connect your wallet',
  });
  await walletModal.waitFor({ state: 'visible' });
  await walletModal.getByRole('button', { name: 'Talisman' }).click();

  await appPage.getByTestId('btn-account-confirm').click();
};
