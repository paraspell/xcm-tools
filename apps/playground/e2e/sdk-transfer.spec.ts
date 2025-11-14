import { expect, Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { createName } from './utils/selectorName';

type TSymbolOptions = 'Auto' | 'Native' | 'Foreign' | 'Foreign abstract';
type TCustomAssetOperation =
  | 'assetId'
  | 'symbol'
  | 'location'
  | 'overridenLocation';

const paraToParaTestData = [
  {
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    currency: 'ASTR - Native',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    currency: 'USDT - 11',
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
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    currency: 'ASTR - Native',
    multicurrency: ['ASTR - Native', 'USDC - 4294969281'],
    feeAsset: 'USDC - 4294969281',
  },
  {
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    multicurrency: ['KSM - Native', 'ZLK - 188'],
    feeAsset: 'KSM - Native',
  },
  {
    fromChain: 'Hydration',
    toChain: 'Acala',
    currency: 'HDX - Native',
    multicurrency: ['HDX - Native', 'WETH - 4'],
    feeAsset: 'WETH - 4',
  },
];

const validLocation = {
  parents: 1,
  interior: {
    X2: [
      {
        Parachain: 2000,
      },
      {
        GeneralKey: {
          length: 2,
          data: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      },
    ],
  },
};

const overridenLocation = {
  parents: 1,
  interior: {
    X3: [
      {
        Parachain: 1000,
      },
      {
        PalletInstance: 50,
      },
      {
        GeneralIndex: 1337,
      },
    ],
  },
};

const overrideTestData = [
  {
    type: 'assetId',
    value: '10',
  },
  {
    type: 'symbol',
    value: 'ACA',
  },
  {
    type: 'location',
    value: JSON.stringify(validLocation),
  },
  {
    type: 'overridenLocation',
    value: JSON.stringify(overridenLocation),
  },
] as { type: TCustomAssetOperation; value: string }[];

const performCustomAction = async (
  appPage: Page,
  type: TCustomAssetOperation,
  textBoxParam: string,
  symbolOptions?: TSymbolOptions,
) => {
  await appPage.locator('[data-path="currencies.0.isCustomCurrency"]').check();

  if (type === 'assetId') {
    await appPage.getByPlaceholder('Asset ID').fill(textBoxParam);
  } else if (type === 'symbol') {
    await appPage.getByLabel('Symbol').locator('..').click();
    await appPage.getByPlaceholder('Symbol').fill(textBoxParam);

    if (symbolOptions) {
      await appPage
        .getByLabel(symbolOptions, { exact: true })
        .locator('..')
        .click();
    }
  } else if (type === 'location') {
    await appPage.getByLabel('Location', { exact: true }).locator('..').click();
    await appPage
      .locator('textarea[data-path="currencies.0.customCurrency"]')
      .fill(textBoxParam);
  } else {
    await appPage.getByLabel('Override location').locator('..').click();
    await appPage
      .locator('textarea[data-path="currencies.0.customCurrency"]')
      .fill(textBoxParam);
  }
};

const performTransfer = async (
  appPage: Page,
  extensionPage: PolkadotjsExtensionPage,
  fromChain: string,
  toChain: string,
  currency: string | null | string[],
  useApi: boolean,
  feeAsset?: string,
  customCurrencyFunction?: () => Promise<void>,
) => {
  await appPage.getByTestId('select-origin').fill(fromChain);
  await appPage.getByRole('option', { name: createName(fromChain) }).click();

  await appPage.getByTestId('select-destination').fill(toChain);
  await appPage.getByRole('option', { name: createName(toChain) }).click();

  if (currency && typeof currency === 'string') {
    await appPage.getByTestId('select-currency').first().click();
    await appPage.getByRole('option', { name: currency }).click();
  } else if (currency) {
    //Multi-currency testing
    const currencies = currency as string[];

    for (let index = 0; index < currencies.length; index++) {
      const currentCurrency = currencies[index];

      if (index > 0) {
        await appPage
          .getByRole('button', { name: 'Add another asset' })
          .click();
      }

      const currencySelects = await appPage
        .getByTestId('select-currency')
        .all();
      const currentSelect = currencySelects[index];
      await currentSelect.click();

      await appPage.getByRole('option', { name: currentCurrency }).click();
      await appPage.getByTestId(`input-amount-${index}`).fill('10');
    }

    // Select fee asset
    await appPage.getByTestId('select-currency').last().click();
    await appPage.getByRole('option', { name: feeAsset }).click();
  }

  if (customCurrencyFunction) {
    await customCurrencyFunction();
  }

  if (useApi) {
    await appPage.getByTestId('checkbox-api').click();
  }

  await appPage.getByTestId('submit').click();

  await appPage.waitForTimeout(3000);
  const error = appPage.getByTestId('error');
  await expect(
    error,
    (await error.isVisible()) ? await error.innerText() : '',
  ).not.toBeVisible();

  await appPage.waitForTimeout(3000);
  await extensionPage.navigate();
  await extensionPage.isPopupOpen();
  await extensionPage.close();

  await extensionPage.close();
};

basePjsTest.describe(`XCM SDK - Transfer E2E Tests`, () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
    await appPage.goto('/xcm-sdk/xcm-transfer');
  });

  basePjsTest.beforeEach(async () => {
    await appPage.reload();
  });

  [true, false].forEach((useApi) => {
    const apiLabel = useApi ? ' - API' : '';
    paraToParaTestData.forEach(({ fromChain, toChain, currency }) => {
      basePjsTest(
        `Should succeed for ParaToPara transfer ${fromChain} -> ${toChain}${apiLabel}`,
        async () => {
          await performTransfer(
            appPage,
            extensionPage,
            fromChain,
            toChain,
            currency,
            useApi,
          );
        },
      );
    });

    paraRelayTestData.forEach(({ fromChain, toChain }) => {
      basePjsTest(
        `Should succeed for RelayToPara transfer ${fromChain} -> ${toChain}${apiLabel}`,
        async () => {
          await performTransfer(
            appPage,
            extensionPage,
            fromChain,
            toChain,
            null,
            useApi,
          );
        },
      );

      basePjsTest(
        `Should succeed for ParaToRelay transfer ${toChain} -> ${fromChain}${apiLabel}`,
        async () => {
          //We switch up the from and to chains
          await performTransfer(
            appPage,
            extensionPage,
            toChain,
            fromChain,
            null,
            useApi,
          );
        },
      );
    });

    multicurrencyTestData.forEach(
      ({ fromChain, toChain, multicurrency, feeAsset }) => {
        basePjsTest(
          `Should succeed for multicurrency transfer ${toChain} -> ${fromChain}${apiLabel}`,
          async () => {
            await performTransfer(
              appPage,
              extensionPage,
              fromChain,
              toChain,
              multicurrency,
              useApi,
              feeAsset,
            );
          },
        );
      },
    );

    overrideTestData.forEach(({ type, value }) => {
      const fromChain = 'Acala';
      const toChain = 'Hydration';

      if (type !== 'symbol') {
        basePjsTest(
          `Should succeed for custom asset transfer - ${type}${apiLabel}`,
          async () => {
            await performTransfer(
              appPage,
              extensionPage,
              fromChain,
              toChain,
              null,
              useApi,
              undefined,
              async () => performCustomAction(appPage, type, value),
            );
          },
        );
      } else {
        (
          ['Auto', 'Native', 'Foreign', 'Foreign abstract'] as TSymbolOptions[]
        ).forEach((symbolOption) => {
          const currencySymbol =
            symbolOption === 'Foreign'
              ? 'UNQ'
              : symbolOption === 'Foreign abstract'
                ? 'WBTC2'
                : value;

          basePjsTest(
            `Should succeed for custom asset transfer - ${type} | ${symbolOption}${apiLabel}`,
            async () => {
              await performTransfer(
                appPage,
                extensionPage,
                fromChain,
                toChain,
                null,
                useApi,
                undefined,
                async () =>
                  await performCustomAction(
                    appPage,
                    type,
                    currencySymbol,
                    symbolOption,
                  ),
              );
            },
          );
        });
      }
    });
  });
});
