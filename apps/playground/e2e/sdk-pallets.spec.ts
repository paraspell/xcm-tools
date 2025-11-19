import { test, expect, Page } from '@playwright/test';
import { SUBSTRATE_CHAINS } from '@paraspell/sdk';
import { createName } from './utils/selectorName';

const performPalletTest = async (
  page: Page,
  funcName: string,
  chain: string,
  useApi: boolean,
) => {
  await page.goto('/xcm-sdk/pallets');

  await page.getByTestId('select-chain').fill(chain);
  await page.getByRole("option", {name: createName(chain)}).click();

  if (useApi) {
    await page.getByTestId('checkbox-api').check();
  }

  await page.getByTestId('select-func').click();
  await page.getByRole("option", {name: funcName}).click();

  await page.getByTestId('submit').click();

  await expect(page.getByTestId('error')).not.toBeVisible();
  await expect(page.getByTestId('output')).toBeVisible();
};

const palletFunctions = ['ALL_PALLETS', 'DEFAULT_PALLET'];

test.describe.configure({ mode: 'parallel' });

test.describe('XCM SDK - Pallets', () => {
  palletFunctions.forEach((funcName) => {
    SUBSTRATE_CHAINS.forEach((chain) => {
      [false, true].forEach((useApi) => {
        const apiLabel = useApi ? ' - API' : '';
        test(`Should succeed for ${funcName} function for ${chain}${apiLabel}`, async ({
          page,
        }) => {
          await performPalletTest(page, funcName, chain, useApi);
        });
      });
    });
  });
});
