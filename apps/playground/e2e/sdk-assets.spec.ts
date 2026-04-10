import { expect, Page, test } from '@playwright/test';

import { enableApiMode, selectSdkFunction } from './utils/sdkForm';
import { TEST_SS58_ADDRESS } from './utils/testData';

const selectFirstOptionFromDropdown = async (
  page: Page,
  dropdownTestId: string,
  excludedOptionPattern?: RegExp,
  index = 0,
) => {
  await page.getByTestId(dropdownTestId).nth(index).click();
  const options = page.getByRole('option');
  const optionsCount = await options.count();
  for (let optionIndex = 0; optionIndex < optionsCount; optionIndex += 1) {
    const option = options.nth(optionIndex);
    const text = (await option.innerText()).trim();
    if (!excludedOptionPattern || !excludedOptionPattern.test(text)) {
      await option.click();
      return;
    }
  }
  throw new Error(`No selectable option found for "${dropdownTestId}".`);
};

const submitAssetsQuery = async (page: Page, useApi = false) => {
  await enableApiMode(page, useApi);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('error')).not.toBeVisible();
  await expect(page.getByTestId('output')).toBeVisible({ timeout: 10_000 });
};

test.describe.configure({ mode: 'parallel' });

test.describe('XCM SDK - Assets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/xcm-sdk/assets');
  });

  test('Should return output for assets object', async ({ page }) => {
    await selectSdkFunction(page, 'ASSETS_OBJECT');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for assets object via API', async ({ page }) => {
    await selectSdkFunction(page, 'ASSETS_OBJECT');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for asset location', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_LOCATION');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for asset location via API', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_LOCATION');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for asset reserve chain', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_RESERVE_CHAIN');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for asset reserve chain via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'ASSET_RESERVE_CHAIN');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for asset info', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_INFO');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-destination');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for asset info via API', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_INFO');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-destination');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for relaychain symbol', async ({ page }) => {
    await selectSdkFunction(page, 'RELAYCHAIN_SYMBOL');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for relaychain symbol via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'RELAYCHAIN_SYMBOL');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for native assets', async ({ page }) => {
    await selectSdkFunction(page, 'NATIVE_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for native assets via API', async ({ page }) => {
    await selectSdkFunction(page, 'NATIVE_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for other assets', async ({ page }) => {
    await selectSdkFunction(page, 'OTHER_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for other assets via API', async ({ page }) => {
    await selectSdkFunction(page, 'OTHER_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for supported assets', async ({ page }) => {
    await selectSdkFunction(page, 'SUPPORTED_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-destination');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for supported assets via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'SUPPORTED_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-destination');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for fee assets', async ({ page }) => {
    await selectSdkFunction(page, 'FEE_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for fee assets via API', async ({ page }) => {
    await selectSdkFunction(page, 'FEE_ASSETS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for all symbols', async ({ page }) => {
    await selectSdkFunction(page, 'ALL_SYMBOLS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for all symbols via API', async ({ page }) => {
    await selectSdkFunction(page, 'ALL_SYMBOLS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for para id', async ({ page }) => {
    await selectSdkFunction(page, 'PARA_ID');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for para id via API', async ({ page }) => {
    await selectSdkFunction(page, 'PARA_ID');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for convert ss58', async ({ page }) => {
    await selectSdkFunction(page, 'CONVERT_SS58');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await page.getByTestId('address-input').fill(TEST_SS58_ADDRESS);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for convert ss58 via API', async ({ page }) => {
    await selectSdkFunction(page, 'CONVERT_SS58');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await page.getByTestId('address-input').fill(TEST_SS58_ADDRESS);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for asset balance', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_BALANCE');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await page.getByTestId('address-input').fill(TEST_SS58_ADDRESS);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for asset balance via API', async ({ page }) => {
    await selectSdkFunction(page, 'ASSET_BALANCE');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await page.getByTestId('address-input').fill(TEST_SS58_ADDRESS);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for existential deposit', async ({ page }) => {
    await selectSdkFunction(page, 'EXISTENTIAL_DEPOSIT');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for existential deposit via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'EXISTENTIAL_DEPOSIT');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for dry run support', async ({ page }) => {
    await selectSdkFunction(page, 'HAS_DRY_RUN_SUPPORT');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for dry run support via API', async ({ page }) => {
    await selectSdkFunction(page, 'HAS_DRY_RUN_SUPPORT');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for ethereum bridge status', async ({ page }) => {
    await selectSdkFunction(page, 'ETHEREUM_BRIDGE_STATUS');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for ethereum bridge status via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'ETHEREUM_BRIDGE_STATUS');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for para eth fees', async ({ page }) => {
    await selectSdkFunction(page, 'PARA_ETH_FEES');
    await submitAssetsQuery(page, false);
  });

  test('Should return output for para eth fees via API', async ({ page }) => {
    await selectSdkFunction(page, 'PARA_ETH_FEES');
    await submitAssetsQuery(page, true);
  });

  test('Should return output for supported destinations', async ({ page }) => {
    await selectSdkFunction(page, 'SUPPORTED_DESTINATIONS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for supported destinations via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'SUPPORTED_DESTINATIONS');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, true);
  });

  test('Should return output for asset info with first available route', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'ASSET_INFO');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-destination');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, false);
  });

  test('Should return output for asset info with first available route via API', async ({
    page,
  }) => {
    await selectSdkFunction(page, 'ASSET_INFO');
    await selectFirstOptionFromDropdown(page, 'select-chain');
    await selectFirstOptionFromDropdown(page, 'select-destination');
    await selectFirstOptionFromDropdown(page, 'select-currency', /custom/i);
    await submitAssetsQuery(page, true);
  });
});
