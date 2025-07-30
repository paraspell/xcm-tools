import { test, expect, Page } from '@playwright/test';
import { CHAIN_NAMES_DOT_KSM, TChain, getOtherAssets } from '@paraspell/sdk';

const performAssetsObjectTest = async (
  page: Page,
  funcName: string,
  nodeName: string,
  useApi: boolean,
) => {
  const showSymbolInput =
    funcName === 'ASSET_ID' ||
    funcName === 'DECIMALS' ||
    funcName == 'HAS_SUPPORT';

  await page.getByTestId('select-func').click();
  await page.getByRole('option', { name: funcName, exact: true }).click();

  await page.getByTestId('select-chain').click();
  await page.getByRole('option', { name: nodeName, exact: true }).click();

  if (showSymbolInput) {
    const randomCurrencySymbol = getOtherAssets(nodeName as TChain).find(
      (asset) => !!asset.assetId && !!asset.symbol,
    )?.symbol;
    if (!randomCurrencySymbol) return;
    await page.getByTestId('input-currency').fill(randomCurrencySymbol ?? '');
  }

  if (useApi) {
    await page.getByTestId('checkbox-api').click();
  }

  await page.getByTestId('submit').click();

  await expect(page.getByTestId('error')).not.toBeVisible();
  await expect(page.getByTestId('output')).toBeVisible();
};

test.describe.configure({ mode: 'parallel' });

test.describe('XCM SDK - Assets', () => {
  const functionNames = [
    'ASSETS_OBJECT',
    'RELAYCHAIN_SYMBOL',
    'NATIVE_ASSETS',
    'OTHER_ASSETS',
    'ALL_SYMBOLS',
    'PARA_ID',
    'ASSET_ID',
    'DECIMALS',
    'HAS_SUPPORT',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/xcm-sdk-sandbox');
    await page.getByTestId('tab-assets').click();
  });

  CHAIN_NAMES_DOT_KSM.forEach((nodeName) => {
    functionNames.forEach((funcName) => {
      [false, true].forEach((useApi) => {
        const apiLabel = useApi ? ' - API' : '';
        test(`Should succeed for ${funcName} function for ${nodeName}${apiLabel}`, async ({
          page,
        }) => {
          await performAssetsObjectTest(page, funcName, nodeName, useApi);
        });
      });
    });
  });
});
