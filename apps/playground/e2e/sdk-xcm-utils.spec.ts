import { expect, Page } from '@playwright/test';
import { getSupportedAssets } from '@paraspell/sdk';

import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import {
  enableApiMode,
  selectSdkCurrency,
  selectSdkDestination,
} from './utils/sdkForm';
import { createName } from './utils/selectorName';
import { TEST_SS58_ADDRESS } from './utils/testData';

type TUtilityAdvancedOptions = {
  development: boolean;
  abstractDecimals: boolean;
  xcmFormatCheck: boolean;
};

type TUtilityAdvancedInputs = {
  method: string;
  pallet: string;
  xcmVersion: string;
  localAccount: 'Alice' | 'Bob';
  apiOverrides?: Array<{ chain: string; endpoint: string }>;
};

type TUtilitySymbolMode = 'Native' | 'Foreign' | 'Foreign abstract';

const EVM_ORIGIN_CHAIN = 'Moonbeam';
const EVM_DESTINATION_CHAIN = 'Moonriver';
const UTILITY_CUSTOM_FROM = 'Hydration';
const UTILITY_CUSTOM_TO = 'Acala';
const UTILITY_NATIVE_SYMBOL = 'HDX';
const UTILITY_FOREIGN_SYMBOL = 'ACA';
const UTILITY_FOREIGN_ABSTRACT_SYMBOL = 'USDT1';
const utilitySupportedAssetId = getSupportedAssets(
  UTILITY_CUSTOM_FROM,
  UTILITY_CUSTOM_TO,
).find((asset) => asset.assetId !== undefined)?.assetId;

const fillUtilityBaseForm = async (page: Page) => {
  await page.getByTestId('select-origin').fill('Astar');
  await page.getByRole('option', { name: createName('Astar') }).click();
  await selectSdkDestination(page, 'BifrostPolkadot');
  await selectSdkCurrency(page, '');
  await page.getByTestId('input-recipient').fill(TEST_SS58_ADDRESS);
  await page.getByTestId('input-amount-0').fill('10');
};

const fillUtilityCustomAssetForm = async (page: Page) => {
  await page.getByTestId('select-origin').fill(UTILITY_CUSTOM_FROM);
  await page
    .getByRole('option', { name: createName(UTILITY_CUSTOM_FROM) })
    .click();
  await selectSdkDestination(page, UTILITY_CUSTOM_TO);
  await selectSdkCurrency(page, '');
  await page.getByTestId('input-recipient').fill(TEST_SS58_ADDRESS);
  await page.getByTestId('input-amount-0').fill('10');
};

const fillUtilityTransactTrustedChainsForm = async (page: Page) => {
  await page.getByTestId('select-origin').fill('AssetHubKusama');
  await page
    .getByRole('option', { name: createName('AssetHubKusama') })
    .click();
  await selectSdkDestination(page, 'BifrostKusama');
  await selectSdkCurrency(page, '');
  await page.getByTestId('input-recipient').fill(TEST_SS58_ADDRESS);
  await page.getByTestId('input-amount-0').fill('10');
};

const fillUtilityEvmForm = async (page: Page) => {
  await page.getByTestId('select-origin').fill(EVM_ORIGIN_CHAIN);
  await page
    .getByRole('option', { name: createName(EVM_ORIGIN_CHAIN) })
    .click();
  await selectSdkDestination(page, EVM_DESTINATION_CHAIN);
  await selectSdkCurrency(page, '');
  await page.getByTestId('input-recipient').fill(TEST_SS58_ADDRESS);
  await page.getByTestId('input-amount-0').fill('10');
  await expect(page.getByTestId('input-address')).toBeVisible();
};

const configureSwapForBestAmountOut = async (page: Page) => {
  await page.getByRole('button', { name: 'Add Swap' }).click();
  await page.getByTestId('swap-slippage-input').fill('1');
  await page.getByTestId('swap-exchange-select').click();
  await page.getByRole('option', { name: 'Hydration' }).click();

  const currencySelectCount = await page.getByTestId('select-currency').count();
  await selectSdkCurrency(page, 'USDT - 10', currencySelectCount - 1);
};

const configureTransactForTransferInfo = async (page: Page) => {
  await page.getByRole('button', { name: 'Add Transact' }).click();
  await page.getByTestId('transact-call-input').fill('0x00');
  await page.getByTestId('transact-ref-time-input').fill('0');
  await page.getByTestId('transact-proof-size-input').fill('0');
  await page.getByTestId('transact-origin-select').click();
  await page.getByRole('option').first().click();
};

const selectUtilitySegmentedOption = async (page: Page, label: string) => {
  const visibleSegmentLabel = page
    .locator('label')
    .filter({ hasText: label })
    .first();
  if (await visibleSegmentLabel.count()) {
    await visibleSegmentLabel.click({ force: true });
    return;
  }

  const radioOption = page
    .getByRole('radio', { name: label, exact: true })
    .first();
  if (await radioOption.count()) {
    await radioOption.check({ force: true });
    return;
  }

  await page
    .getByLabel(label, { exact: true })
    .first()
    .locator('..')
    .click({ force: true });
};

const configureUtilityCustomSymbol = async (
  page: Page,
  symbol: string,
  symbolMode: TUtilitySymbolMode,
) => {
  const customAssetCheckbox = page.getByLabel('Select custom asset').first();
  if (!(await customAssetCheckbox.isChecked())) {
    await customAssetCheckbox.check({ force: true });
  }

  await selectUtilitySegmentedOption(page, 'Symbol');
  await page.getByPlaceholder('Symbol').first().fill(symbol);
  await selectUtilitySegmentedOption(page, symbolMode);
};

const configureUtilityCustomAssetId = async (page: Page, assetId: string) => {
  const customAssetCheckbox = page.getByLabel('Select custom asset').first();
  if (!(await customAssetCheckbox.isChecked())) {
    await customAssetCheckbox.check({ force: true });
  }

  await selectUtilitySegmentedOption(page, 'Asset ID');
  await page.getByPlaceholder('Asset ID').first().fill(assetId);
};

const setSwitchValue = async (
  switchLocator: ReturnType<Page['getByTestId']>,
  value: boolean,
) => {
  if ((await switchLocator.isChecked()) !== value) {
    await switchLocator.click();
  }
};

const openAdvancedOptionsAccordion = async (page: Page) => {
  const developmentSwitch = page.getByTestId('switch-development');
  if (await developmentSwitch.isVisible()) return;

  const accordionControl = page
    .locator('button:has-text("Advanced options")')
    .first();
  if (await accordionControl.isVisible()) {
    await accordionControl.click({ force: true });
  } else {
    await page
      .getByText('Advanced options', { exact: true })
      .first()
      .click({ force: true });
  }

  await expect(developmentSwitch).toBeVisible({ timeout: 10_000 });
};

const applyUtilityAdvancedOptions = async (
  page: Page,
  options: TUtilityAdvancedOptions,
  inputs: TUtilityAdvancedInputs,
) => {
  await openAdvancedOptionsAccordion(page);
  await setSwitchValue(
    page.getByTestId('switch-development'),
    options.development,
  );
  await setSwitchValue(
    page.getByTestId('switch-abstract-decimals'),
    options.abstractDecimals,
  );
  await setSwitchValue(
    page.getByLabel('XCM Format Check'),
    options.xcmFormatCheck,
  );

  await page.getByTestId('select-xcm-version').click();
  await page.getByRole('option', { name: inputs.xcmVersion }).click();

  await page.getByTestId('select-local-account').click();
  await page.getByRole('option', { name: inputs.localAccount }).click();

  await page.getByTestId('input-pallet').fill(inputs.pallet);
  await page.getByTestId('input-method').fill(inputs.method);

  const overrides = inputs.apiOverrides ?? [];
  for (let i = 0; i < overrides.length; i++) {
    const override = overrides[i];
    await page.getByRole('button', { name: 'Add chain' }).click();
    await page.getByTestId('select-chain').nth(i).click();
    await page
      .getByRole('option', { name: createName(override.chain) })
      .click();
    await page.getByTestId('input-endpoint').nth(i).fill(override.endpoint);
  }
};

const expectUtilityOutput = async (page: Page) => {
  await expect(page.getByTestId('error')).not.toBeVisible();
  await expect(page.getByTestId('output')).toBeVisible({ timeout: 20_000 });
};

const ACTION_PARENT_MENU: Record<string, string> = {
  'Get XCM Fee': 'Fees',
  'Get Origin XCM Fee': 'Fees',
  'Get Transferable Amount': 'Amounts',
  'Get Min Transferable Amount': 'Amounts',
  'Get Receivable Amount': 'Amounts',
  'Get Best Amount Out': 'Amounts',
  'Verify ED on Destination': 'Info',
  'Get Transfer Info': 'Info',
};

const selectUtilityAction = async (
  page: Page,
  actionLabel: string,
  // The merged transfer form groups the utility actions under sub-menus
  // (Fees / Amounts / Info), so the legacy testid override is no longer
  // meaningful — kept only for call-site compatibility.
  _actionTestId?: string,
) => {
  const actionsButton = page.getByTestId('btn-actions');
  await expect(actionsButton).toBeVisible();
  await actionsButton.click();

  const parentLabel = ACTION_PARENT_MENU[actionLabel];
  if (parentLabel) {
    await page
      .getByRole('menuitem', { name: parentLabel, exact: true })
      .hover();
  }

  const actionMenuItem = page.getByRole('menuitem', {
    name: actionLabel,
    exact: true,
  });
  await expect(actionMenuItem).toBeVisible();
  await actionMenuItem.click();
};

basePjsTest.describe('XCM SDK - Utilities', () => {
  let appPage: Page;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto('/xcm-sdk/xcm-transfer');
  });

  basePjsTest('Should run Get XCM Fee action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(appPage, 'Get XCM Fee');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get XCM Fee action - API', async () => {
    await fillUtilityBaseForm(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(appPage, 'Get XCM Fee');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Origin XCM Fee action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(appPage, 'Get Origin XCM Fee');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Origin XCM Fee action - API', async () => {
    await fillUtilityBaseForm(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(appPage, 'Get Origin XCM Fee');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Transferable Amount action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(appPage, 'Get Transferable Amount');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Transferable Amount action - API', async () => {
    await fillUtilityBaseForm(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(appPage, 'Get Transferable Amount');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Min Transferable Amount action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(appPage, 'Get Min Transferable Amount');
    await expectUtilityOutput(appPage);
  });

  basePjsTest(
    'Should run Get Min Transferable Amount action - API',
    async () => {
      await fillUtilityBaseForm(appPage);
      await enableApiMode(appPage, true);
      await selectUtilityAction(appPage, 'Get Min Transferable Amount');
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest('Should run Verify ED on Destination action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(appPage, 'Verify ED on Destination');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Verify ED on Destination action - API', async () => {
    await fillUtilityBaseForm(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(appPage, 'Verify ED on Destination');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Transfer Info action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(
      appPage,
      'Get Transfer Info',
      'menu-item-transfer-info',
    );
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Transfer Info action via API', async () => {
    await fillUtilityBaseForm(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(
      appPage,
      'Get Transfer Info',
      'menu-item-transfer-info',
    );
    await expectUtilityOutput(appPage);
  });

  basePjsTest(
    'Should run Get Transfer Info action with custom symbol Foreign',
    async () => {
      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomSymbol(
        appPage,
        UTILITY_FOREIGN_SYMBOL,
        'Foreign',
      );
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom symbol Foreign - API',
    async () => {
      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomSymbol(
        appPage,
        UTILITY_FOREIGN_SYMBOL,
        'Foreign',
      );
      await enableApiMode(appPage, true);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom symbol Native',
    async () => {
      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomSymbol(
        appPage,
        UTILITY_NATIVE_SYMBOL,
        'Native',
      );
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom symbol Native - API',
    async () => {
      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomSymbol(
        appPage,
        UTILITY_NATIVE_SYMBOL,
        'Native',
      );
      await enableApiMode(appPage, true);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom symbol Foreign abstract',
    async () => {
      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomSymbol(
        appPage,
        UTILITY_FOREIGN_ABSTRACT_SYMBOL,
        'Foreign abstract',
      );
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom symbol Foreign abstract - API',
    async () => {
      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomSymbol(
        appPage,
        UTILITY_FOREIGN_ABSTRACT_SYMBOL,
        'Foreign abstract',
      );
      await enableApiMode(appPage, true);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom assetId',
    async () => {
      basePjsTest.skip(
        utilitySupportedAssetId === undefined,
        'Supported assetId is not available for Hydration -> Acala.',
      );

      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomAssetId(
        appPage,
        String(utilitySupportedAssetId),
      );
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with custom assetId - API',
    async () => {
      basePjsTest.skip(
        utilitySupportedAssetId === undefined,
        'Supported assetId is not available for Hydration -> Acala.',
      );

      await fillUtilityCustomAssetForm(appPage);
      await configureUtilityCustomAssetId(
        appPage,
        String(utilitySupportedAssetId),
      );
      await enableApiMode(appPage, true);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest('Should run Get Receivable Amount action', async () => {
    await fillUtilityBaseForm(appPage);
    await selectUtilityAction(appPage, 'Get Receivable Amount');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Receivable Amount action - API', async () => {
    await fillUtilityBaseForm(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(appPage, 'Get Receivable Amount');
    await expectUtilityOutput(appPage);
  });

  basePjsTest(
    'Should require AssetHub address for EVM origin on Get Transfer Info action',
    async () => {
      await fillUtilityEvmForm(appPage);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expect(
        appPage.getByText('AssetHub address is required for EVM origin.'),
      ).toBeVisible();
      await expect(appPage.getByTestId('output')).not.toBeVisible();
    },
  );

  basePjsTest(
    'Should validate AssetHub address format for EVM origin on Get Receivable Amount action',
    async () => {
      await fillUtilityEvmForm(appPage);
      await appPage.getByTestId('input-address').fill('not-a-valid-address');
      await selectUtilityAction(appPage, 'Get Receivable Amount');
      await expect(appPage.getByText('Invalid Polkadot address')).toBeVisible();
      await expect(appPage.getByTestId('output')).not.toBeVisible();
    },
  );

  basePjsTest('Should run Get Best Amount Out action', async () => {
    await fillUtilityBaseForm(appPage);
    await configureSwapForBestAmountOut(appPage);
    await selectUtilityAction(appPage, 'Get Best Amount Out');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Best Amount Out action - API', async () => {
    await fillUtilityBaseForm(appPage);
    await configureSwapForBestAmountOut(appPage);
    await enableApiMode(appPage, true);
    await selectUtilityAction(appPage, 'Get Best Amount Out');
    await expectUtilityOutput(appPage);
  });

  basePjsTest('Should run Get Transfer Info action with transact', async () => {
    await fillUtilityTransactTrustedChainsForm(appPage);
    await configureTransactForTransferInfo(appPage);
    await selectUtilityAction(
      appPage,
      'Get Transfer Info',
      'menu-item-transfer-info',
    );
    await expectUtilityOutput(appPage);
  });

  basePjsTest(
    'Should run Get Transfer Info action with transact - API',
    async () => {
      await fillUtilityTransactTrustedChainsForm(appPage);
      await configureTransactForTransferInfo(appPage);
      await applyUtilityAdvancedOptions(
        appPage,
        {
          development: false,
          abstractDecimals: false,
          xcmFormatCheck: false,
        },
        {
          xcmVersion: 'V4',
          localAccount: 'Alice',
          pallet: 'XTokens',
          method: 'transfer',
        },
      );
      await enableApiMode(appPage, true);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with advanced options',
    async () => {
      await fillUtilityBaseForm(appPage);
      await applyUtilityAdvancedOptions(
        appPage,
        {
          development: false,
          abstractDecimals: false,
          xcmFormatCheck: false,
        },
        {
          xcmVersion: 'V4',
          localAccount: 'Alice',
          pallet: 'XTokens',
          method: 'transfer',
        },
      );
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should run Get Transfer Info action with advanced options - API',
    async () => {
      await fillUtilityBaseForm(appPage);
      await applyUtilityAdvancedOptions(
        appPage,
        {
          development: false,
          abstractDecimals: false,
          xcmFormatCheck: false,
        },
        {
          xcmVersion: 'V4',
          localAccount: 'Alice',
          pallet: 'XTokens',
          method: 'transfer',
        },
      );
      await enableApiMode(appPage, true);
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expectUtilityOutput(appPage);
    },
  );

  basePjsTest(
    'Should fail Get Transfer Info action with advanced options in development mode without overrides',
    async () => {
      await fillUtilityBaseForm(appPage);
      await applyUtilityAdvancedOptions(
        appPage,
        {
          development: true,
          abstractDecimals: false,
          xcmFormatCheck: true,
        },
        {
          xcmVersion: 'V5',
          localAccount: 'Bob',
          pallet: '',
          method: '',
        },
      );
      await selectUtilityAction(
        appPage,
        'Get Transfer Info',
        'menu-item-transfer-info',
      );
      await expect(appPage.getByTestId('error')).toContainText(
        /Development mode requires an API override/i,
      );
    },
  );
});
