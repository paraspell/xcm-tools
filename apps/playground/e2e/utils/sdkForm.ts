import type { Page } from '@playwright/test';

import { createName } from './selectorName';

export const enableApiMode = async (page: Page, useApi: boolean) => {
  if (!useApi) {
    return;
  }

  await page.getByTestId('checkbox-api').check();
};

export const selectSdkFunction = async (page: Page, funcName: string) => {
  await page.getByTestId('select-func').click();
  await page.getByRole('option', { name: funcName, exact: true }).click();
};

export const selectSdkChain = async (page: Page, chain: string) => {
  await page.getByTestId('select-chain').fill(chain);
  await page.getByRole('option', { name: createName(chain) }).click();
};

export const selectSdkDestination = async (page: Page, destination: string) => {
  await page.getByTestId('select-destination').fill(destination);
  await page.getByRole('option', { name: createName(destination) }).click();
};

export const selectSdkCurrency = async (
  page: Page,
  currency: string,
  index = 0,
) => {
  await page.getByTestId('select-currency').nth(index).click();
  await page.getByRole('option', { name: currency, exact: true }).click();
};
