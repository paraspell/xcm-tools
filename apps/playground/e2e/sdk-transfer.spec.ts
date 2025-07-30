import { expect, Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import {
  CHAINS_WITH_RELAY_CHAINS,
  getRelayChainSymbol,
  TChainWithRelayChains,
  getAllAssetsSymbols,
  TChain,
  CHAIN_NAMES_DOT_KSM,
} from '@paraspell/sdk';

const excludedChains = new Set(['Quartz', 'CoretimeKusama']);

const chains = CHAINS_WITH_RELAY_CHAINS.filter(
  (chain) => !excludedChains.has(chain),
);

function getRelayChainForChain(chain: TChainWithRelayChains): string {
  return getRelayChainSymbol(chain) === 'DOT' ? 'Polkadot' : 'Kusama';
}

const getAssetsForChain = (chain: TChainWithRelayChains): string[] => {
  if (chain === 'Pendulum') return ['PEN'];
  if (chain === 'Nodle') return ['NODL'];
  if (chain === 'Crust') return ['EQD'];
  if (chain === 'CrustShadow') return ['KAR'];
  if (chain === 'Phala') return ['PHA'];
  if (chain === 'Mythos') return ['MYTH'];
  return getAllAssetsSymbols(chain);
};

const findTransferableChain = (
  from: TChainWithRelayChains,
): TChain | undefined => {
  const allFromAssets = getAssetsForChain(from);

  const chainTo = CHAIN_NAMES_DOT_KSM.filter(
    (chain) => getRelayChainSymbol(chain) === getRelayChainSymbol(from),
  ).find((chain) => {
    const chainAssets = getAllAssetsSymbols(chain);
    const commonAsset = chainAssets.filter((asset) =>
      allFromAssets.includes(asset),
    )[0];
    return commonAsset !== undefined;
  });

  return chainTo;
};

chains.forEach((chain) => {
  const relayChain = getRelayChainForChain(chain);
  if (!relayChain) return;
  const anotherParachain = findTransferableChain(chain);
  if (!anotherParachain) return;

  basePjsTest.describe(`XCM SDK - Transfer for chain ${chain}`, () => {
    let appPage: Page;
    let extensionPage: PolkadotjsExtensionPage;

    basePjsTest.beforeAll(async ({ context }) => {
      ({ appPage, extensionPage } = await setupPolkadotExtension(context));
      await appPage.goto('/xcm-sdk-sandbox');
    });

    basePjsTest.beforeEach(async () => {
      await appPage.reload();
    });

    basePjsTest(
      `Should succeed for ParaToPara transfer ${chain} -> ${anotherParachain}`,
      async () => {
        await appPage.getByTestId('select-origin').click();
        await appPage.getByRole('option', { name: chain, exact: true }).click();

        await appPage.getByTestId('select-destination').click();
        await appPage
          .getByRole('option', { name: anotherParachain, exact: true })
          .click();

        await appPage.getByTestId('select-currency').click();
        await appPage.getByRole('option').first().click();

        await appPage.getByTestId('submit').click();

        await appPage.waitForTimeout(3000);
        const error = appPage.getByTestId('error');
        await expect(
          error,
          (await error.isVisible()) ? await error.innerText() : '',
        ).not.toBeVisible();

        await extensionPage.navigate();
        await extensionPage.isPopupOpen();
        await extensionPage.close();
      },
    );

    if (!['Crust', 'CrustShadow', 'Phala'].includes(chain)) {
      basePjsTest(
        `Should succeed for ParaToRelay transfer ${chain} -> ${relayChain}`,
        async () => {
          await appPage.getByTestId('select-origin').click();
          await appPage
            .getByRole('option', { name: chain, exact: true })
            .click();

          await appPage.getByTestId('select-destination').click();
          await appPage
            .getByRole('option', { name: relayChain, exact: true })
            .click();

          await appPage.getByTestId('submit').click();

          await appPage.waitForTimeout(3000);
          const error = appPage.getByTestId('error');
          await expect(
            error,
            (await error.isVisible()) ? await error.innerText() : '',
          ).not.toBeVisible();

          await extensionPage.navigate();
          await extensionPage.isPopupOpen();
          await extensionPage.close();
        },
      );
    }

    basePjsTest(
      `Should succeed for RelayToPara transfer ${relayChain} -> ${chain}`,
      async () => {
        await appPage.getByTestId('select-origin').click();
        await appPage
          .getByRole('option', { name: relayChain, exact: true })
          .click();

        await appPage.getByTestId('select-destination').click();
        await appPage.getByRole('option', { name: chain, exact: true }).click();

        await appPage.getByTestId('submit').click();

        await appPage.waitForTimeout(3000);
        const error = appPage.getByTestId('error');
        await expect(
          error,
          (await error.isVisible()) ? await error.innerText() : '',
        ).not.toBeVisible();

        await extensionPage.navigate();
        await extensionPage.isPopupOpen();
        await extensionPage.close();
      },
    );
  });
});
