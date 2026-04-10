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
  const requestedOption = page.getByRole('option', {
    name: currency,
    exact: true,
  });
  if (await requestedOption.count()) {
    await requestedOption.first().click();
    return;
  }

  const options = page.getByRole('option');
  const optionsCount = await options.count();
  for (let i = 0; i < optionsCount; i += 1) {
    const option = options.nth(i);
    const optionText = (await option.innerText()).trim();
    if (!/custom/i.test(optionText)) {
      await option.click();
      return;
    }
  }

  throw new Error('No selectable currency options are available.');
};
