import { expect, Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { TChain } from '@paraspell/sdk';
import {
  baseTalismanWithEthereumTest,
  connectEVMAccount,
  setupTalismanExtension,
} from './baseTalismanWithEthereum';
import { createName } from './utils/selectorName';

const exchanges = [
  {
    exchange: 'HydrationDex',
    fromChain: 'Astar',
    toChain: 'BifrostPolkadot',
    fromCurrency: 'ASTR - Location',
    toCurrency: 'USDC - 22',
  },
  {
    exchange: 'KaruraDex',
    fromChain: 'AssetHubKusama',
    toChain: 'BifrostKusama',
    fromCurrency: 'KSM - Location',
    toCurrency: 'RMRK - 0',
  },
  {
    exchange: 'AcalaDex',
    fromChain: 'Astar',
    toChain: 'Unique',
    fromCurrency: 'aSEED - 18446744073709551617',
    toCurrency: 'DOT - Location',
  },
  {
    exchange: 'BifrostPolkadotDex',
    fromChain: 'Hydration',
    toChain: 'Acala',
    fromCurrency: 'vDOT - 15',
    toCurrency: 'DOT - 0',
  },
];

const automaticSelectionTests = [
  {
    fromChain: 'Astar',
    toChain: 'Hydration',
    fromCurrency: 'ASTR - Location',
    toCurrency: 'DOT - Location',
  },

  {
    fromChain: 'Ajuna',
    toChain: 'Acala',
    fromCurrency: 'USDC - 1337',
    toCurrency: 'DOT - Location',
  },

  {
    fromChain: 'Hydration',
    toChain: 'AssetHubPolkadot',
    fromCurrency: 'HDX - Location',
    toCurrency: 'DOT - Location',
  },
];

const evmTests = [
  {
    fromChain: 'Astar',
    toChain: 'Ethereum',
    fromCurrency: 'ASTR - Location',
    toCurrency: 'USDC - Location',
  },
  {
    fromChain: 'Astar',
    toChain: 'Moonbeam',
    fromCurrency: 'ASTR - Location',
    toCurrency: 'USDC - Location',
  },
];

const performTest = async (
  appPage: Page,
  extensionPage: PolkadotjsExtensionPage | null,
  fromChain: TChain,
  toChain: TChain,
  fromCurrency: string,
  toCurrency: string,
  exchange: string | null,
  {
    useApi,
  }: {
    useApi: boolean;
  },
) => {
  const isDestinationEVM =
    toChain === 'Ethereum' || toChain === 'Moonbeam' || toChain === 'Moonriver';
  const useExchangeAutoselect = exchange === null;

  const fromChainValue = await appPage.getByTestId('select-from').inputValue();

  if (fromChainValue !== fromChain) {
    await appPage.getByTestId('select-from').fill(fromChain);
    await appPage.getByRole('option', { name: createName(fromChain) }).click();
  }

  if (!useExchangeAutoselect) {
    await appPage.getByTestId('select-exchange').click();
    await appPage.getByRole('option', { name: createName(exchange) }).click();
  }

  const toChainValue = await appPage.getByTestId('select-to').inputValue();

  if (toChainValue !== toChain) {
    await appPage.getByTestId('select-to').fill(toChain);
    await appPage.getByRole('option', { name: createName(toChain) }).click();
  }

  await appPage.getByTestId('select-currency-from').click();
  await appPage.getByRole('option', { name: fromCurrency }).first().click();

  await appPage.getByTestId('select-currency-to').click();
  await appPage.getByRole('option', { name: toCurrency }).first().click();

  if (!isDestinationEVM) {
    await appPage
      .getByTestId('input-recipient-address')
      .fill('5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz');
  } else {
    appPage.getByTestId('connect-evm-wallet').click();
    await connectEVMAccount(appPage);

    await appPage
      .getByTestId('input-recipient-address')
      .fill('0x11A1598991904CF7355224Da444C463E6797Ed52');
  }

  await appPage.getByTestId('input-amount').fill('10');

  await appPage.getByTestId('input-slippage-pct').fill('1');

  if (useApi) {
    await appPage.getByTestId('checkbox-api').click();
  }

  await appPage.getByTestId('submit').click();

  await appPage.waitForTimeout(10000);

  if (useExchangeAutoselect) {
    const loadingText = appPage.getByText('Searching for best exchange rate');
    await loadingText.waitFor({ state: 'hidden' });
  }

  const error = appPage.getByTestId('error');

  if (await error.isVisible()) {
    const text = await error.innerText();
    expect(text).toMatch(
      /The native currency balance on \w+ is too low to cover the fees\. Please provide a larger amount\./,
    );
  } else {
    if (extensionPage != null) {
      await extensionPage.navigate();
      await extensionPage.isPopupOpen();
      await extensionPage.close();
    }
  }
};

basePjsTest.describe('RouterTransferForm E2E Tests', () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;
  basePjsTest.setTimeout(120000);

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto('/xcm-router');
  });

  exchanges.map(
    ({ exchange, fromChain, toChain, fromCurrency, toCurrency }) => {
      basePjsTest(`Exchange: ${exchange}`, async () => {
        await performTest(
          appPage,
          extensionPage,
          fromChain as TChain,
          toChain as TChain,
          fromCurrency,
          toCurrency,
          exchange,
          { useApi: false },
        );
      });

      basePjsTest(`Exchange: ${exchange} - API`, async () => {
        await performTest(
          appPage,
          extensionPage,
          fromChain as TChain,
          toChain as TChain,
          fromCurrency,
          toCurrency,
          exchange,
          { useApi: true },
        );
      });
    },
  );

  automaticSelectionTests.map(
    ({ fromChain, toChain, fromCurrency, toCurrency }) => {
      basePjsTest(
        `Automatic exchange selection from ${fromChain} to ${toChain}`,
        async () => {
          await performTest(
            appPage,
            extensionPage,
            fromChain as TChain,
            toChain as TChain,
            fromCurrency,
            toCurrency,
            null,
            { useApi: false },
          );
        },
      );

      basePjsTest(
        `Automatic exchange selection from ${fromChain} to ${toChain} - API`,
        async () => {
          await performTest(
            appPage,
            extensionPage,
            fromChain as TChain,
            toChain as TChain,
            fromCurrency,
            toCurrency,
            null,
            { useApi: true },
          );
        },
      );
    },
  );
});

baseTalismanWithEthereumTest.describe(
  'RouterTransferForm Ethereum E2E Tests',
  () => {
    let appPage: Page;
    baseTalismanWithEthereumTest.setTimeout(120000);

    baseTalismanWithEthereumTest.beforeAll(
      async ({ context, importAccounts }) => {
        ({ appPage } = await setupTalismanExtension(
          context,
          importAccounts,
        ));
      },
    );

    baseTalismanWithEthereumTest.beforeEach(async () => {
      await appPage.goto('/xcm-router');
    });

    evmTests.map(({ fromChain, toChain, fromCurrency, toCurrency }) => {
      baseTalismanWithEthereumTest(
        `Automatic exchange selection from ${fromChain} to ${toChain}`,
        async () => {
          await performTest(
            appPage,
            null,
            fromChain as TChain,
            toChain as TChain,
            fromCurrency,
            toCurrency,
            null,
            { useApi: false },
          );
        },
      );

      baseTalismanWithEthereumTest(
        `Automatic exchange selection from ${fromChain} to ${toChain} - API`,
        async () => {
          await performTest(
            appPage,
            null,
            fromChain as TChain,
            toChain as TChain,
            fromCurrency,
            toCurrency,
            null,
            { useApi: true },
          );
        },
      );
    });
  },
);
