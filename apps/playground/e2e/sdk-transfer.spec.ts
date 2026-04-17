import { expect, Locator, Page } from '@playwright/test';
import {
  getOtherAssets,
  getSupportedAssets,
  TRANSACT_ORIGINS,
  Version,
} from '@paraspell/sdk';

import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { enableApiMode, selectSdkCurrency } from './utils/sdkForm';
import { createName } from './utils/selectorName';
import type { TAdvancedOptions, TChainApiOverride } from '../src/types';

type TSymbolOptions = 'Auto' | 'Native' | 'Foreign' | 'Foreign abstract';
type TCustomAssetOperation =
  | 'assetId'
  | 'symbol'
  | 'location'
  | 'overridenLocation';

type TTransferAdvancedOptions = Required<
  Pick<TAdvancedOptions, 'development' | 'abstractDecimals' | 'xcmFormatCheck'>
>;

type TTransferAdvancedInputs = Pick<
  Required<TAdvancedOptions>,
  'method' | 'pallet'
> & {
  xcmVersion: Version;
  localAccount: 'Alice' | 'Bob';
  apiOverrides?: Array<Pick<TChainApiOverride, 'chain'> & { endpoint: string }>;
};

type TExpandedCustomAssetCase = {
  label: string;
  type: TCustomAssetOperation;
  value: string;
  symbolOption?: TSymbolOptions;
};

type TCustomAssetTransferCase = TExpandedCustomAssetCase & {
  fromChain: string;
  toChain: string;
};

type TTransferCurrency = string | string[] | null;

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

const SYMBOL_OPTIONS: TSymbolOptions[] = [
  'Auto',
  'Native',
];

const paraToParaTestData = [
  {
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    currency: 'ASTR - Native',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    currency: 'MOVR - Location',
  },
  {
    fromChain: 'Astar',
    toChain: 'Unique',
    currency: 'USDT - 4294969280',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'Basilisk',
    currency: 'KSM - Native',
  },
  {
    fromChain: 'Hydration',
    toChain: 'Acala',
    currency: 'HDX - Native',
  },
  {
    fromChain: 'Crust',
    toChain: 'Acala',
    currency: 'CRU - Native',
  },
];

const paraRelayTestData = [
  {
    fromChain: 'Jamton',
    toChain: 'Polkadot',
  },

  {
    fromChain: 'Kusama',
    toChain: 'BridgeHubKusama',
  },
];

const multicurrencyTestData = [
  {
    fromChain: 'Hydration',
    toChain: 'Acala',
    currency: 'HDX - Native',
    multicurrency: ['HDX - Native', 'USDT - 10'],
    feeAsset: 'USDT - 10',
  },
];

const MULTICURRENCY_XCM_EXECUTE_LIMITATION =
  /Cannot use overridden assets with XCM execute/i;

const swapTestData = [
  {
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    currency: 'ASTR - Native',
  },
];

const swapInputOptions = [
  {
    label: 'default slippage',
    slippage: '15',
    swapCurrency: 'USDT - 10',
    exchange: 'Hydration',
  },
  {
    label: 'tight slippage',
    slippage: '5',
    swapCurrency: 'USDT - 10',
    exchange: 'Hydration',
  },
];

const customSwapBaseCase = {
  fromChain: 'Astar',
  toChain: 'BifrostPolkadot',
  currency: 'ASTR - Native',
  slippage: '5',
  exchange: ['Hydration', 'AssetHubPolkadot'],
};

const transactTestData = [
  {
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    currency: 'KSM - Native',
  },
];

const transactInputOptions = [
  {
    label: 'minimal call',
    call: '0x00',
    refTime: '0',
    proofSize: '0',
  },
  {
    label: 'call with weight',
    call: '0x0102',
    refTime: '1000000000',
    proofSize: '100000',
  },
];

const transferAdvancedTestCases: Array<{
  label: string;
  options: TTransferAdvancedOptions;
  inputs: TTransferAdvancedInputs;
  expectedError?: RegExp;
}> = [
  {
    label: 'baseline',
    options: {
      development: false,
      abstractDecimals: false,
      xcmFormatCheck: false,
    },
    inputs: {
      xcmVersion: Version.V4,
      localAccount: 'Alice',
      pallet: 'XTokens',
      method: 'transfer',
    },
  },
  {
    label: 'xcm-check + abstract decimals + api override',
    options: {
      development: false,
      abstractDecimals: true,
      xcmFormatCheck: true,
    },
    inputs: {
      xcmVersion: Version.V5,
      localAccount: 'Bob',
      pallet: 'PolkadotXcm',
      method: 'transfer_assets',
      apiOverrides: [{ chain: 'Kusama', endpoint: 'wss://kusama-rpc.polkadot.io' }],
    },
    expectedError:
      /Cannot read properties of undefined \(reading 'type'\)/i,
  },
  {
    label: 'development mode + missing api overrides',
    options: {
      development: true,
      abstractDecimals: false,
      xcmFormatCheck: true,
    },
    inputs: {
      xcmVersion: Version.V5,
      localAccount: 'Bob',
      pallet: '',
      method: '',
    },
    expectedError:
      /Development mode requires an API override for .*Please provide an API client or WebSocket URL in the apiOverrides configuration\./i,
  },
];

const HYDRATION_CUSTOM_FROM = 'Hydration';
const HYDRATION_CUSTOM_TO = 'Acala';
const HYDRATION_NATIVE_SYMBOL = 'HDX';
const ASTAR_NATIVE_SYMBOL = 'ASTR';

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
const fallbackLocationAsset = hydrationOtherAssets.find((asset) => !!asset.location);
const locationAsset = supportedLocationAsset ?? fallbackLocationAsset;

if (!symbolAsset?.symbol || !locationAsset?.location) {
  throw new Error(
    'Unable to build stable custom asset test data from Hydration assets.',
  );
}

const customLocationJson = JSON.stringify(locationAsset.location);

const getTransferSymbolBySpecifier = (symbolOption: TSymbolOptions): string => {
  if (symbolOption === 'Native') {
    return HYDRATION_NATIVE_SYMBOL;
  }

  return symbolAsset.symbol;
};

const customAssetTransferCases: TCustomAssetTransferCase[] = [
  ...SYMBOL_OPTIONS.map((symbolOption) => ({
    label: `symbol | ${symbolOption}`,
    type: 'symbol' as const,
    value: getTransferSymbolBySpecifier(symbolOption),
    symbolOption,
    fromChain: HYDRATION_CUSTOM_FROM,
    toChain: HYDRATION_CUSTOM_TO,
  })),
  ...(supportedAssetIdAsset
    ? [
        {
          label: 'assetId',
          type: 'assetId' as const,
          value: String(supportedAssetIdAsset.assetId),
          fromChain: HYDRATION_CUSTOM_FROM,
          toChain: HYDRATION_CUSTOM_TO,
        },
      ]
    : []),
  ...(supportedLocationAsset
    ? [
        {
          label: 'location',
          type: 'location' as const,
          value: customLocationJson,
          fromChain: HYDRATION_CUSTOM_FROM,
          toChain: HYDRATION_CUSTOM_TO,
        },
        {
          label: 'overridenLocation',
          type: 'overridenLocation' as const,
          value: customLocationJson,
          fromChain: HYDRATION_CUSTOM_FROM,
          toChain: HYDRATION_CUSTOM_TO,
        },
      ]
    : []),
];

const customSwapAssetCases: TExpandedCustomAssetCase[] = SYMBOL_OPTIONS
  .filter((symbolOption) => symbolOption !== 'Native')
  .map((symbolOption) => ({
    label: `symbol | ${symbolOption}`,
    type: 'symbol',
    value: 'DOT',
    symbolOption,
  }));

const performCustomAction = async (
  appPage: Page,
  type: TCustomAssetOperation,
  textBoxParam: string,
  symbolOptions?: TSymbolOptions,
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
        const clickableLabel = root.locator(`label[for="${checkboxId}"]`).first();
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
      const checkboxByDataPath = root.locator(`[data-path="${dataPath}"]`).first();
      if (await checkboxByDataPath.count()) {
        await ensureChecked(checkboxByDataPath);
        return;
      }
    }

    throw new Error(`Unable to locate custom asset checkbox for "${fieldPath}".`);
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

    const radioOption = root.getByRole('radio', { name: label, exact: true }).first();
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

    if (symbolOptions) {
      await selectSegmentedOption(symbolOptions);
    }
  } else if (type === 'location') {
    await selectSegmentedOption('Location');
    await fillCustomJsonField('Input JSON location or interior junctions');
  } else {
    await selectSegmentedOption('Override location');
    await fillCustomJsonField(
      'Provide the JSON location to override the default configuration',
    );
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

const fillTransferCurrencies = async (
  appPage: Page,
  currency: TTransferCurrency,
  feeAsset?: string,
) => {
  if (currency && typeof currency === 'string') {
    await selectSdkCurrency(appPage, currency, 0);
    return;
  }

  if (!currency) {
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

  const currencySelectCount = await appPage.getByTestId('select-currency').count();
  await selectSdkCurrency(appPage, feeAsset, currencySelectCount - 1);
};

const addSwapOptions = async (
  appPage: Page,
  slippage: string,
  swapCurrency: string | undefined,
  exchange: string | string[],
  customAssetType?: TCustomAssetOperation,
  customAssetValue?: string,
  customAssetSymbolOption?: TSymbolOptions,
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
      customAssetSymbolOption,
      'swapOptions.currencyTo',
      swapFieldset,
    );
  } else if (swapCurrency) {
    const currencySelectCount = await appPage.getByTestId('select-currency').count();
    await selectSdkCurrency(appPage, swapCurrency, currencySelectCount - 1);
  }
};

const addTransactOptions = async (
  appPage: Page,
  call: string,
  refTime: string,
  proofSize: string,
  originKind: string,
) => {
  const addTransactButton = appPage.getByRole('button', { name: 'Add Transact' });
  if (await addTransactButton.isVisible()) {
    await addTransactButton.click();
  }
  await appPage.getByTestId('transact-call-input').fill(call);

  await appPage.getByTestId('transact-ref-time-input').fill(refTime);

  await appPage.getByTestId('transact-proof-size-input').fill(proofSize);

  await appPage.getByTestId('transact-origin-select').click();
  await appPage
    .getByRole('option', { name: originKind, exact: true })
    .click();
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

  await expect(developmentSwitch).toBeVisible({ timeout: 10000 });
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

  await appPage.getByTestId('input-pallet').fill(inputs.pallet);
  await appPage.getByTestId('input-method').fill(inputs.method);

  const overrides = inputs.apiOverrides ?? [];

  for (let i = 0; i < overrides.length; i++) {
    const override = overrides[i];
    await appPage.getByRole('button', { name: 'Add chain' }).click();
    await appPage.getByTestId('select-chain').nth(i).click();
    await appPage.getByRole('option', { name: createName(override.chain) }).click();
    await appPage.getByTestId('input-endpoint').nth(i).fill(override.endpoint);
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

  await appPage.waitForTimeout(3000);
  const error = appPage.getByTestId('error');
  if (expectedErrorPattern) {
    await expect(error).toBeVisible();
    await expect(error).toContainText(expectedErrorPattern);
    return;
  }

  await expect(error, (await error.isVisible()) ? await error.innerText() : '').not.toBeVisible();

  if (expectPopup) {
    await appPage.waitForTimeout(3000);
    await extensionPage.navigate();
    await extensionPage.isPopupOpen();
    await extensionPage.close();
    await extensionPage.close();
  }
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

  [false, true].forEach((useApi) => {
    const apiLabel = useApi ? ' - API' : '';
    paraToParaTestData.forEach(({ fromChain, toChain, currency }) => {
      basePjsTest(
        `Should succeed for ParaToPara transfer ${fromChain} -> ${toChain}${apiLabel}`,
        async () => {
          await performTransfer(appPage, extensionPage, {
            fromChain,
            toChain,
            currency,
            useApi,
          });
        },
      );
    });

    paraRelayTestData.forEach(({ fromChain, toChain }) => {
      basePjsTest(
        `Should succeed for RelayToPara transfer ${fromChain} -> ${toChain}${apiLabel}`,
        async () => {
          await performTransfer(appPage, extensionPage, {
            fromChain,
            toChain,
            currency: null,
            useApi,
          });
        },
      );

      basePjsTest(
        `Should succeed for ParaToRelay transfer ${toChain} -> ${fromChain}${apiLabel}`,
        async () => {
          // We switch up the from and to chains.
          await performTransfer(appPage, extensionPage, {
            fromChain: toChain,
            toChain: fromChain,
            currency: null,
            useApi,
          });
        },
      );
    });

    multicurrencyTestData.forEach(
      ({ fromChain, toChain, multicurrency, feeAsset }) => {
        const expectedError = useApi
          ? MULTICURRENCY_XCM_EXECUTE_LIMITATION
          : undefined;
        const outcomeLabel = expectedError ? 'Should fail' : 'Should succeed';
        basePjsTest(
          `${outcomeLabel} for multicurrency transfer ${toChain} -> ${fromChain}${apiLabel}`,
          async () => {
            await performTransfer(appPage, extensionPage, {
              fromChain,
              toChain,
              currency: multicurrency,
              useApi,
              feeAsset,
              expectPopup: !expectedError,
              expectedErrorPattern: expectedError,
            });
          },
        );
      },
    );

    customAssetTransferCases.forEach(
      ({ type, value, symbolOption, label, fromChain, toChain }) => {
        basePjsTest(
          `Should succeed for custom asset transfer - ${label}${apiLabel}`,
          async () => {
            await performTransfer(appPage, extensionPage, {
              fromChain,
              toChain,
              currency: null,
              useApi,
              customCurrencyFunction: async () =>
                performCustomAction(appPage, type, value, symbolOption),
            });
          },
        );
      },
    );

    swapTestData.forEach(({ fromChain, toChain, currency }) => {
      swapInputOptions.forEach(({ label, slippage, swapCurrency, exchange }) => {
        basePjsTest(
          `Should succeed for Swap transfer | ${label}${apiLabel}`,
          async () => {
            await performTransfer(appPage, extensionPage, {
              fromChain,
              toChain,
              currency,
              useApi,
              customCurrencyFunction: async () =>
                addSwapOptions(appPage, slippage, swapCurrency, exchange),
            });
          },
        );
      });
    });

    customSwapAssetCases.forEach(({ type, value, symbolOption, label }) => {
      basePjsTest(
        `Should succeed for custom asset Swap transfer - ${label}${apiLabel}`,
        async () => {
          await performTransfer(appPage, extensionPage, {
            fromChain: customSwapBaseCase.fromChain,
            toChain: customSwapBaseCase.toChain,
            currency: customSwapBaseCase.currency,
            useApi,
            customCurrencyFunction: async () =>
              addSwapOptions(
                appPage,
                customSwapBaseCase.slippage,
                undefined,
                customSwapBaseCase.exchange,
                type,
                value,
                symbolOption,
              ),
          });
        },
      );
    });

    const advancedBaseCase = paraToParaTestData[0];
    transferAdvancedTestCases.forEach(({ label, options, inputs, expectedError }) => {
      const outcomeLabel = expectedError ? 'Should fail' : 'Should succeed';
      basePjsTest(
        `${outcomeLabel} for Transfer with advanced options ${label}${apiLabel}`,
        async () => {
          const expectPopup = !expectedError;
          await performTransfer(appPage, extensionPage, {
            fromChain: advancedBaseCase.fromChain,
            toChain: advancedBaseCase.toChain,
            currency: advancedBaseCase.currency,
            useApi,
            advancedOptionsFunction: async () =>
              applyTransferAdvancedOptions(appPage, options, inputs),
            expectPopup,
            expectedErrorPattern: expectedError,
          });
        },
      );
    });

    transactTestData.forEach(({ fromChain, toChain, currency }) => {
      transactInputOptions.forEach(({ label, call, refTime, proofSize }) => {
        TRANSACT_ORIGINS.forEach((originKind) => {
          basePjsTest(
            `Should succeed for Transact transfer | ${label} | ${originKind}${apiLabel}`,
            async () => {
              await performTransfer(appPage, extensionPage, {
                fromChain,
                toChain,
                currency,
                useApi,
                customCurrencyFunction: async () =>
                  addTransactOptions(
                    appPage,
                    call,
                    refTime,
                    proofSize,
                    originKind,
                  ),
              });
            },
          );
        });
      });
    });
  });
});
