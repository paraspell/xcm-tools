import { test, expect, Page } from '@playwright/test';
import { TChain, TSubstrateChain, getOtherAssets } from '@paraspell/sdk';
import { createName } from './utils/selectorName';

const chainsToTest = [
  "Acala",
  "Hydration",
  "Crust"
] as TSubstrateChain[]


const performAssetsObjectTest = async (
  page: Page,
  funcName: string,
  chain: string,
  useApi: boolean,
) => {
  const showSymbolInput =
    funcName === 'ASSET_ID' ||
    funcName === 'DECIMALS' ||
    funcName == 'HAS_SUPPORT';

  await page.getByTestId('select-func').click();
  await page.getByRole("option", {name: funcName}).click();

  await page.getByTestId('select-chain').fill(chain);
  await page.getByRole("option", {name: createName(chain)}).click();


  if (showSymbolInput) {
    const randomCurrencySymbol = getOtherAssets(chain as TChain).find(
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
    await page.goto('/xcm-sdk/assets');
  });

  chainsToTest.forEach((chain) => {
    functionNames.forEach((funcName) => {
      [false, true].forEach((useApi) => {
        const apiLabel = useApi ? ' - API' : '';
        test(`Should succeed for ${funcName} function for ${chain}${apiLabel}`, async ({
          page,
        }) => {
          await performAssetsObjectTest(page, funcName, chain, useApi);
        });
      });
    });
  });
});
