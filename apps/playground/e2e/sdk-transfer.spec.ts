import { expect, Locator, Page } from '@playwright/test';
import { getOtherAssets, getSupportedAssets } from '@paraspell/sdk';

import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { enableApiMode, selectSdkCurrency } from './utils/sdkForm';
import { acknowledgeTransferWarningIfOpened } from './utils/transferWarningModal';
import { createName } from './utils/selectorName';

type TSymbolMode = 'Auto' | 'Native' | 'Foreign' | 'Foreign abstract';
type TCustomAssetOperation = 'assetId' | 'symbol' | 'location';

type TTransferAdvancedOptions = {
  development: boolean;
  abstractDecimals: boolean;
  xcmFormatCheck: boolean;
};

type TTransferAdvancedInputs = {
  method?: string;
  pallet?: string;
  xcmVersion: string;
  localAccount: 'Alice' | 'Bob';
  apiOverrides?: Array<{ chain: string; endpoints: string[] }>;
};

type TTransferCurrency = string[] | null;

type TPerformTransferOptions = {
  fromChain: string;
  toChain: string;
  currency: TTransferCurrency;
  useApi: boolean;
  feeAsset?: string;
  customCurrencyFunction?: () => Promise<void>;
  advancedOptionsFunction?: () => Promise<void>;
  expectPopup?: boolean;
  expectedErrorPattern?: RegExp;
};

const MULTICURRENCY_XCM_EXECUTE_LIMITATION =
  /Cannot use overridden assets with XCM execute/i;

const customSwapBaseCase = {
  fromChain: 'Astar',
  toChain: 'BifrostPolkadot',
  slippage: '5',
  exchange: ['Hydration', 'AssetHubPolkadot'],
};

const transferAdvancedBase = {
  fromChain: 'Astar',
  toChain: 'BifrostPolkadot',
};

const transactApiAdvancedConfig = {
  options: {
    development: false,
    abstractDecimals: false,
    xcmFormatCheck: false,
  },
  inputs: {
    xcmVersion: 'V4',
    localAccount: 'Alice',
    pallet: 'XTokens',
    method: 'transfer',
  } as TTransferAdvancedInputs,
};

const HYDRATION_CUSTOM_FROM = 'Hydration';
const HYDRATION_CUSTOM_TO = 'Acala';
const HYDRATION_NATIVE_SYMBOL = 'HDX';
const FOREIGN_SYMBOL = 'ACA';
const FOREIGN_ABSTRACT_SYMBOL = 'USDT1';
const SWAP_CUSTOM_SYMBOL = 'BNC';

const hydrationOtherAssets = getOtherAssets(HYDRATION_CUSTOM_FROM);
const hydrationSupportedAssets = getSupportedAssets(
  HYDRATION_CUSTOM_FROM,
  HYDRATION_CUSTOM_TO,
);

const symbolAsset =
  hydrationSupportedAssets.find((asset) => !!asset.symbol) ??
  hydrationOtherAssets.find((asset) => !!asset.symbol);

const supportedAssetIdAsset = hydrationSupportedAssets.find(
  (asset) => asset.assetId !== undefined,
);

const supportedLocationAsset = hydrationSupportedAssets.find(
  (asset) => !!asset.location,
);
const fallbackLocationAsset = hydrationOtherAssets.find(
  (asset) => !!asset.location,
);
const locationAsset = supportedLocationAsset ?? fallbackLocationAsset;

if (!symbolAsset?.symbol || !locationAsset?.location) {
  throw new Error(
    'Unable to build stable custom asset test data from Hydration assets.',
  );
}

const customLocationJson = JSON.stringify(locationAsset.location);

const getTransferSymbolByMode = (symbolMode: TSymbolMode): string => {
  if (symbolMode === 'Native') {
    return HYDRATION_NATIVE_SYMBOL;
  } else if (symbolMode === 'Foreign') {
    return FOREIGN_SYMBOL;
  } else if (symbolMode === 'Foreign abstract') {
    return FOREIGN_ABSTRACT_SYMBOL;
  }

  return symbolAsset.symbol;
};

const performCustomAction = async (
  appPage: Page,
  type: TCustomAssetOperation,
  textBoxParam: string,
  symbolMode?: TSymbolMode,
  fieldPath = 'currencies.0',
  scope?: Locator,
) => {
  const root = scope ?? appPage;

  const toggleCustomAsset = async () => {
    const ensureChecked = async (checkbox: Locator) => {
      if (await checkbox.isChecked()) return;

      try {
        await checkbox.check({ force: true });
      } catch {
        // Fall through to alternative interactions when direct check is flaky.
      }
      if (await checkbox.isChecked()) return;

      const checkboxId = await checkbox.getAttribute('id');
      if (checkboxId) {
        const clickableLabel = root
          .locator(`label[for="${checkboxId}"]`)
          .first();
        if (await clickableLabel.count()) {
          await clickableLabel.scrollIntoViewIfNeeded();
          await clickableLabel.click({ force: true });
        }
      }
      if (await checkbox.isChecked()) return;

      await checkbox.click({ force: true });
      if (await checkbox.isChecked()) return;

      await expect(checkbox).toBeChecked({ timeout: 2000 });
    };

    const customAssetCheckbox = root.getByLabel('Select custom asset').first();
    if (await customAssetCheckbox.count()) {
      await ensureChecked(customAssetCheckbox);
      return;
    }

    const dataPathFallbacks = [
      `${fieldPath}.isCustomCurrency`,
      `form-${fieldPath}.isCustomCurrency`,
    ];

    for (const dataPath of dataPathFallbacks) {
      const checkboxByDataPath = root
        .locator(`[data-path="${dataPath}"]`)
        .first();
      if (await checkboxByDataPath.count()) {
        await ensureChecked(checkboxByDataPath);
        return;
      }
    }

    throw new Error(
      `Unable to locate custom asset checkbox for "${fieldPath}".`,
    );
  };

  const selectSegmentedOption = async (label: string) => {
    const visibleSegmentLabel = root
      .locator('label')
      .filter({ hasText: label })
      .first();
    if (await visibleSegmentLabel.count()) {
      await visibleSegmentLabel.scrollIntoViewIfNeeded();
      await visibleSegmentLabel.click({ force: true });
      return;
    }

    const radioOption = root
      .getByRole('radio', { name: label, exact: true })
      .first();
    if (await radioOption.count()) {
      await radioOption.check({ force: true });
      return;
    }

    await root
      .getByLabel(label, { exact: true })
      .first()
      .locator('..')
      .click({ force: true });
  };

  await toggleCustomAsset();

  const fillCustomJsonField = async (placeholder: string) => {
    const jsonInput = root.getByPlaceholder(placeholder).first();
    if (await jsonInput.count()) {
      await jsonInput.fill(textBoxParam);
      return;
    }

    await root
      .locator(
        `textarea[data-path="${fieldPath}.customCurrency"], textarea[data-path="form-${fieldPath}.customCurrency"]`,
      )
      .first()
      .fill(textBoxParam);
  };

  if (type === 'assetId') {
    await selectSegmentedOption('Asset ID');
    await root.getByPlaceholder('Asset ID').fill(textBoxParam);
  } else if (type === 'symbol') {
    await selectSegmentedOption('Symbol');
    await root.getByPlaceholder('Symbol').fill(textBoxParam);

    if (symbolMode) {
      await selectSegmentedOption(symbolMode);
    }
  } else {
    await selectSegmentedOption('Location');
    await fillCustomJsonField('Input JSON location or interior junctions');
  }
};

const selectTransferChain = async (
  appPage: Page,
  testId: 'select-origin' | 'select-destination',
  chain: string,
) => {
  await appPage.getByTestId(testId).fill(chain);
  await appPage.getByRole('option', { name: createName(chain) }).click();
};

const selectFirstOptionFromDropdown = async (
  appPage: Page,
  dropdownTestId: string,
  excludedOptionPattern?: RegExp,
  index = 0,
) => {
  await appPage.getByTestId(dropdownTestId).nth(index).click();
  const options = appPage.getByRole('option');
  const optionsCount = await options.count();

  for (let optionIndex = 0; optionIndex < optionsCount; optionIndex += 1) {
    const option = options.nth(optionIndex);
    const text = (await option.innerText()).trim();
    if (!excludedOptionPattern || !excludedOptionPattern.test(text)) {
      await option.click();
      return text;
    }
  }

  throw new Error(
    `No selectable option found for "${dropdownTestId}" dropdown.`,
  );
};

const fillTransferCurrencies = async (
  appPage: Page,
  currency: TTransferCurrency,
  feeAsset?: string,
) => {
  if (!currency) {
    await selectFirstOptionFromDropdown(appPage, 'select-currency', /custom/i);
    await appPage.getByTestId('input-amount-0').fill('10');
    return;
  }

  // Multi-currency testing.
  for (let index = 0; index < currency.length; index++) {
    const currentCurrency = currency[index];

    if (index > 0) {
      await appPage.getByRole('button', { name: 'Add another asset' }).click();
    }

    await selectSdkCurrency(appPage, currentCurrency, index);
    await appPage.getByTestId(`input-amount-${index}`).fill('10');
  }

  if (!feeAsset) {
    throw new Error('Fee asset is required for multicurrency transfer tests.');
  }

  const currencySelectCount = await appPage
    .getByTestId('select-currency')
    .count();
  await selectSdkCurrency(appPage, feeAsset, currencySelectCount - 1);
};

const addSwapOptions = async (
  appPage: Page,
  slippage: string,
  swapCurrency: string | undefined,
  exchange: string | string[],
  customAssetType?: TCustomAssetOperation,
  customAssetValue?: string,
  customAssetSymbolMode?: TSymbolMode,
) => {
  await appPage.getByRole('button', { name: 'Add Swap' }).click();

  await appPage.getByTestId('swap-slippage-input').fill(slippage);

  // Select exchange
  await appPage.getByTestId('swap-exchange-select').click();
  const exchanges = Array.isArray(exchange) ? exchange : [exchange];
  for (const exchangeOption of exchanges) {
    await appPage.getByRole('option', { name: exchangeOption }).click();
  }

  if (customAssetType && customAssetValue) {
    const swapFieldset = appPage.locator('fieldset').filter({
      has: appPage.locator('legend', { hasText: 'Swap' }),
    });

    await performCustomAction(
      appPage,
      customAssetType,
      customAssetValue,
      customAssetSymbolMode,
      'swapOptions.currencyTo',
      swapFieldset,
    );
  } else if (swapCurrency) {
    const currencySelectCount = await appPage
      .getByTestId('select-currency')
      .count();
    await selectSdkCurrency(appPage, swapCurrency, currencySelectCount - 1);
  } else {
    const currencySelectCount = await appPage
      .getByTestId('select-currency')
      .count();
    await selectFirstOptionFromDropdown(
      appPage,
      'select-currency',
      /custom/i,
      currencySelectCount - 1,
    );
  }
};

const addTransactOptions = async (
  appPage: Page,
  call: string,
  refTime: string,
  proofSize: string,
  originKind?: string,
) => {
  const addTransactButton = appPage.getByRole('button', {
    name: 'Add Transact',
  });
  if (await addTransactButton.isVisible()) {
    await addTransactButton.click();
  }
  await appPage.getByTestId('transact-call-input').fill(call);

  await appPage.getByTestId('transact-ref-time-input').fill(refTime);

  await appPage.getByTestId('transact-proof-size-input').fill(proofSize);

  await appPage.getByTestId('transact-origin-select').click();
  if (originKind) {
    await appPage
      .getByRole('option', { name: originKind, exact: true })
      .click();
    return;
  }

  const firstOrigin = appPage.getByRole('option').first();
  await expect(firstOrigin).toBeVisible();
  await firstOrigin.click();
};

const setSwitchValue = async (switchLocator: Locator, value: boolean) => {
  if ((await switchLocator.isChecked()) !== value) {
    await switchLocator.click();
  }
};

const openAdvancedOptionsAccordion = async (appPage: Page) => {
  const developmentSwitch = appPage.getByTestId('switch-development');
  if (await developmentSwitch.isVisible()) return;

  const accordionControl = appPage
    .locator('button:has-text("Advanced options")')
    .first();

  if (await accordionControl.isVisible()) {
    await accordionControl.scrollIntoViewIfNeeded();
    await accordionControl.click({ force: true });
  } else {
    await appPage
      .getByText('Advanced options', { exact: true })
      .first()
      .click({ force: true });
  }

  await expect(developmentSwitch).toBeVisible();
};

const applyTransferAdvancedOptions = async (
  appPage: Page,
  options: TTransferAdvancedOptions,
  inputs: TTransferAdvancedInputs,
) => {
  await openAdvancedOptionsAccordion(appPage);

  await setSwitchValue(
    appPage.getByTestId('switch-development'),
    options.development,
  );
  await setSwitchValue(
    appPage.getByTestId('switch-abstract-decimals'),
    options.abstractDecimals,
  );
  await setSwitchValue(
    appPage.getByLabel('XCM Format Check'),
    options.xcmFormatCheck,
  );

  await appPage.getByTestId('select-xcm-version').click();
  await appPage.getByRole('option', { name: inputs.xcmVersion }).click();

  await appPage.getByTestId('select-local-account').click();
  await appPage.getByRole('option', { name: inputs.localAccount }).click();

  if (inputs.pallet)
    await appPage.getByTestId('input-pallet').fill(inputs.pallet);

  if (inputs.method)
    await appPage.getByTestId('input-method').fill(inputs.method);

  const overrides = inputs.apiOverrides ?? [];

  let endpointStart = 0;
  for (let i = 0; i < overrides.length; i++) {
    const override = overrides[i];
    await appPage.getByRole('button', { name: 'Add chain' }).click();
    await appPage.getByTestId('select-chain').nth(i).click();
    await appPage
      .getByRole('option', { name: createName(override.chain) })
      .click();

    for (let j = 1; j < override.endpoints.length; j++) {
      await appPage
        .getByRole('button', { name: 'Add endpoint' })
        .nth(i)
        .click();
    }

    for (let j = 0; j < override.endpoints.length; j++) {
      await appPage
        .getByTestId('input-endpoint')
        .nth(endpointStart + j)
        .fill(override.endpoints[j]);
    }
    endpointStart += override.endpoints.length;
  }
};

const performTransfer = async (
  appPage: Page,
  extensionPage: PolkadotjsExtensionPage,
  {
    fromChain,
    toChain,
    currency,
    useApi,
    feeAsset,
    customCurrencyFunction,
    advancedOptionsFunction,
    expectPopup = true,
    expectedErrorPattern,
  }: TPerformTransferOptions,
) => {
  await selectTransferChain(appPage, 'select-origin', fromChain);
  await selectTransferChain(appPage, 'select-destination', toChain);
  await fillTransferCurrencies(appPage, currency, feeAsset);
  await customCurrencyFunction?.();
  await advancedOptionsFunction?.();
  await enableApiMode(appPage, useApi);

  await appPage.getByTestId('submit').click();
  await acknowledgeTransferWarningIfOpened(appPage);

  const error = appPage.getByTestId('error');
  if (expectedErrorPattern) {
    await expect(error).toBeVisible();
    await expect(error).toContainText(expectedErrorPattern);
    return;
  }

  await expect(
    error,
    (await error.isVisible()) ? await error.innerText() : '',
  ).not.toBeVisible();

  if (expectPopup) {
    await expectExtensionPopupAndClose(extensionPage);
  }
};

const expectExtensionPopupAndClose = async (
  extensionPage: PolkadotjsExtensionPage,
) => {
  await extensionPage.navigate();
  await extensionPage.isPopupOpen();
  await extensionPage.close();
  await extensionPage.close();
};

const fillBaseTransferForm = async (
  appPage: Page,
  fromChain = 'Astar',
  toChain = 'BifrostPolkadot',
) => {
  await selectTransferChain(appPage, 'select-origin', fromChain);
  await selectTransferChain(appPage, 'select-destination', toChain);
  await selectFirstOptionFromDropdown(appPage, 'select-currency', /custom/i);
  await appPage.getByTestId('input-amount-0').fill('10');
};

const submitTransferMenuAction = async (
  appPage: Page,
  actionName: 'Dry run' | 'Dry run preview',
) => {
  const submitButton = appPage.getByTestId('submit');
  const buttonGroup = submitButton.locator('xpath=..');
  await buttonGroup.getByRole('button').nth(1).click();
  await appPage
    .getByRole('menuitem', { name: actionName, exact: true })
    .click();
};

const expectTransferOutputWithoutError = async (appPage: Page) => {
  const error = appPage.getByTestId('error');
  await expect(
    error,
    (await error.isVisible()) ? await error.innerText() : '',
  ).not.toBeVisible();
  await expect(appPage.getByTestId('output')).toBeVisible();
};

basePjsTest.describe(`XCM SDK - Transfer E2E Tests`, () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
    await appPage.goto('/xcm-sdk/xcm-transfer');
  });

  basePjsTest.beforeEach(async () => {
    // Reloading keeps nuqs query params from the previous test, which leaves the
    // Transact panel open and hides "Add Transact". Navigate to a clean URL instead.
    await appPage.goto('/xcm-sdk/xcm-transfer');
  });

  basePjsTest(
    'Should succeed for transfer with MAX amount toggle',
    async () => {
      await selectTransferChain(appPage, 'select-origin', 'Astar');
      await selectTransferChain(
        appPage,
        'select-destination',
        'BifrostPolkadot',
      );
      await selectFirstOptionFromDropdown(
        appPage,
        'select-currency',
        /custom/i,
      );

      const maxCheckbox = appPage.getByLabel('MAX').first();
      await maxCheckbox.check({ force: true });
      await expect(maxCheckbox).toBeChecked();

      await appPage.getByTestId('submit').click();
      await acknowledgeTransferWarningIfOpened(appPage);

      const error = appPage.getByTestId('error');
      await expect(
        error,
        (await error.isVisible()) ? await error.innerText() : '',
      ).not.toBeVisible();

      await expectExtensionPopupAndClose(extensionPage);
    },
  );

  basePjsTest('Should run transfer dry run without warning modal', async () => {
    await fillBaseTransferForm(appPage);
    await submitTransferMenuAction(appPage, 'Dry run');

    await expectTransferOutputWithoutError(appPage);
    await expect(
      appPage.getByRole('button', { name: 'I understand' }),
    ).not.toBeVisible();
  });

  basePjsTest(
    'Should run transfer dry run preview without warning modal',
    async () => {
      await fillBaseTransferForm(appPage);
      await submitTransferMenuAction(appPage, 'Dry run preview');

      await expectTransferOutputWithoutError(appPage);
      await expect(
        appPage.getByRole('button', { name: 'I understand' }),
      ).not.toBeVisible();
    },
  );

  basePjsTest(
    'Should succeed for ParaToPara transfer Astar -> BifrostPolkadot',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Astar',
        toChain: 'BifrostPolkadot',
        currency: null,
        useApi: false,
      });
    },
  );

  basePjsTest(
    'Should succeed for ParaToPara transfer Astar -> BifrostPolkadot - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Astar',
        toChain: 'BifrostPolkadot',
        currency: null,
        useApi: true,
      });
    },
  );

  basePjsTest(
    'Should succeed for RelayToPara transfer Jamton -> Polkadot',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Jamton',
        toChain: 'Polkadot',
        currency: null,
        useApi: false,
      });
    },
  );

  basePjsTest(
    'Should succeed for RelayToPara transfer Jamton -> Polkadot - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Jamton',
        toChain: 'Polkadot',
        currency: null,
        useApi: true,
      });
    },
  );

  basePjsTest(
    'Should succeed for ParaToRelay transfer Polkadot -> Jamton',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Polkadot',
        toChain: 'Jamton',
        currency: null,
        useApi: false,
      });
    },
  );

  basePjsTest(
    'Should succeed for ParaToRelay transfer Polkadot -> Jamton - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Polkadot',
        toChain: 'Jamton',
        currency: null,
        useApi: true,
      });
    },
  );

  basePjsTest(
    'Should succeed for multicurrency transfer Hydration -> Acala',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Hydration',
        toChain: 'Acala',
        currency: ['HDX - Native', 'USDT - 10'],
        feeAsset: 'USDT - 10',
        useApi: false,
      });
    },
  );

  basePjsTest(
    'Should fail for multicurrency transfer Hydration -> Acala - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'Hydration',
        toChain: 'Acala',
        currency: ['HDX - Native', 'USDT - 10'],
        feeAsset: 'USDT - 10',
        useApi: true,
        expectPopup: false,
        expectedErrorPattern: MULTICURRENCY_XCM_EXECUTE_LIMITATION,
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol auto',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Auto'),
            'Auto',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol auto - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Auto'),
            'Auto',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol native - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Native'),
            'Native',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol foreign',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Foreign'),
            'Foreign',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol foreign - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Foreign'),
            'Foreign',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol foreign abstract',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Foreign abstract'),
            'Foreign abstract',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - symbol foreign abstract - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'symbol',
            getTransferSymbolByMode('Foreign abstract'),
            'Foreign abstract',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - assetId',
    async () => {
      basePjsTest.skip(
        !supportedAssetIdAsset,
        'Supported assetId is not available for Hydration -> Acala.',
      );

      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'assetId',
            String(supportedAssetIdAsset?.assetId),
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - assetId - API',
    async () => {
      basePjsTest.skip(
        !supportedAssetIdAsset,
        'Supported assetId is not available for Hydration -> Acala.',
      );

      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          performCustomAction(
            appPage,
            'assetId',
            String(supportedAssetIdAsset?.assetId),
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - location',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          performCustomAction(appPage, 'location', customLocationJson),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset transfer - location - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: HYDRATION_CUSTOM_FROM,
        toChain: HYDRATION_CUSTOM_TO,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          performCustomAction(appPage, 'location', customLocationJson),
      });
    },
  );

  basePjsTest(
    'Should succeed for Swap transfer | default slippage',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: customSwapBaseCase.fromChain,
        toChain: customSwapBaseCase.toChain,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          addSwapOptions(appPage, '15', undefined, 'Hydration'),
      });
    },
  );

  basePjsTest(
    'Should succeed for Swap transfer | default slippage - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: customSwapBaseCase.fromChain,
        toChain: customSwapBaseCase.toChain,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          addSwapOptions(appPage, '15', undefined, 'Hydration'),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset Swap transfer - symbol auto',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: customSwapBaseCase.fromChain,
        toChain: customSwapBaseCase.toChain,
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          addSwapOptions(
            appPage,
            customSwapBaseCase.slippage,
            undefined,
            customSwapBaseCase.exchange,
            'symbol',
            SWAP_CUSTOM_SYMBOL,
            'Auto',
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for custom asset Swap transfer - symbol auto - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: customSwapBaseCase.fromChain,
        toChain: customSwapBaseCase.toChain,
        currency: null,
        useApi: true,
        customCurrencyFunction: async () =>
          addSwapOptions(
            appPage,
            customSwapBaseCase.slippage,
            undefined,
            customSwapBaseCase.exchange,
            'symbol',
            SWAP_CUSTOM_SYMBOL,
            'Auto',
          ),
      });
    },
  );

  basePjsTest(
    'Should fail for Transfer with advanced options development mode + missing api overrides',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: transferAdvancedBase.fromChain,
        toChain: transferAdvancedBase.toChain,
        currency: null,
        useApi: false,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
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
          ),
        expectPopup: false,
        expectedErrorPattern:
          /Development mode requires an API override for .*Please provide an API client or WebSocket URL in the apiOverrides configuration\./i,
      });
    },
  );

  basePjsTest(
    'Should fail for Transfer with advanced options development mode + missing api overrides - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: transferAdvancedBase.fromChain,
        toChain: transferAdvancedBase.toChain,
        currency: null,
        useApi: true,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
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
          ),
        expectPopup: false,
        expectedErrorPattern:
          /Development mode requires an API override for .*Please provide an API client or WebSocket URL in the apiOverrides configuration\./i,
      });
    },
  );

  basePjsTest(
    'Should fail for Transfer with advanced options (V5 + Bob + PolkadotXcm transfer_assets)',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: transferAdvancedBase.fromChain,
        toChain: transferAdvancedBase.toChain,
        currency: null,
        useApi: false,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
            appPage,
            {
              development: false,
              abstractDecimals: true,
              xcmFormatCheck: true,
            },
            {
              xcmVersion: 'V5',
              localAccount: 'Bob',
              pallet: 'PolkadotXcm',
              method: 'transfer_assets',
            },
          ),
        expectPopup: false,
        expectedErrorPattern:
          /Incompatible runtime entry RuntimeCall\(DryRunApi_dry_run_call\)/,
      });
    },
  );

  basePjsTest(
    'Should fail for Transfer with advanced options development mode + valid api override - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: transferAdvancedBase.fromChain,
        toChain: transferAdvancedBase.toChain,
        currency: null,
        useApi: true,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
            appPage,
            {
              development: true,
              abstractDecimals: false,
              xcmFormatCheck: false,
            },
            {
              xcmVersion: 'V5',
              localAccount: 'Alice',
              apiOverrides: [
                {
                  chain: 'Astar',
                  endpoints: [
                    'wss://astar.public.curie.radiumblock.co/ws',
                    'wss://rpc.astar.network',
                  ],
                },
                {
                  chain: 'BifrostPolkadot',
                  endpoints: [
                    'wss://hk.p.bifrost-rpc.liebi.com/ws',
                    'wss://eu.bifrost-polkadot-rpc.liebi.com/ws',
                  ],
                },
              ],
            },
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for Transfer with advanced options development mode + valid api override',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: transferAdvancedBase.fromChain,
        toChain: transferAdvancedBase.toChain,
        currency: null,
        useApi: false,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
            appPage,
            {
              development: true,
              abstractDecimals: false,
              xcmFormatCheck: false,
            },
            {
              xcmVersion: 'V5',
              localAccount: 'Alice',
              apiOverrides: [
                {
                  chain: 'Astar',
                  endpoints: [
                    'wss://astar.public.curie.radiumblock.co/ws',
                    'wss://rpc.astar.network',
                  ],
                },
                {
                  chain: 'BifrostPolkadot',
                  endpoints: [
                    'wss://hk.p.bifrost-rpc.liebi.com/ws',
                    'wss://eu.bifrost-polkadot-rpc.liebi.com/ws',
                  ],
                },
              ],
            },
          ),
      });
    },
  );

  basePjsTest(
    'Should succeed for Transact transfer | minimal call',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'AssetHubKusama',
        toChain: 'BifrostKusama',
        currency: null,
        useApi: false,
        customCurrencyFunction: async () =>
          addTransactOptions(appPage, '0x00', '0', '0'),
      });
    },
  );

  basePjsTest(
    'Should succeed for Transact transfer | minimal call - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'AssetHubKusama',
        toChain: 'BifrostKusama',
        currency: null,
        useApi: true,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
            appPage,
            transactApiAdvancedConfig.options,
            transactApiAdvancedConfig.inputs,
          ),
        customCurrencyFunction: async () =>
          addTransactOptions(appPage, '0x00', '0', '0'),
      });
    },
  );

  basePjsTest(
    'Should succeed for Transact transfer | call with weight - API',
    async () => {
      await performTransfer(appPage, extensionPage, {
        fromChain: 'AssetHubKusama',
        toChain: 'BifrostKusama',
        currency: null,
        useApi: true,
        advancedOptionsFunction: async () =>
          applyTransferAdvancedOptions(
            appPage,
            transactApiAdvancedConfig.options,
            transactApiAdvancedConfig.inputs,
          ),
        customCurrencyFunction: async () =>
          addTransactOptions(appPage, '0x0102', '1000000000', '100000'),
      });
    },
  );
});
