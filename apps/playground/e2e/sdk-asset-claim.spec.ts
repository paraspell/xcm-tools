import { Page } from '@playwright/test';
import { basePjsTest, setupPolkadotExtension } from './basePjsTest';
import { PolkadotjsExtensionPage } from './pom';
import { TChainDotKsmWithRelayChains } from '@paraspell/sdk';

const supportedChains = [
  'Polkadot',
  'Kusama',
  'AssetHubPolkadot',
  'AssetHubKusama',
] as TChainDotKsmWithRelayChains[];

const performAssetClaim = async (
  appPage: Page,
  extensionPage: PolkadotjsExtensionPage,
  chain: TChainDotKsmWithRelayChains,
  {
    useApi,
  }: {
    useApi: boolean;
  },
) => {
  await appPage.getByTestId('tab-asset-claim').click();

  await appPage.getByTestId('select-origin').click();
  await appPage.getByRole('option', { name: chain, exact: true }).click();

  if (useApi) {
    await appPage.getByTestId('checkbox-api').click();
  }

  await appPage.getByTestId('submit').click();

  await appPage.waitForTimeout(3000);
  await extensionPage.navigate();
  await extensionPage.isPopupOpen();

  await extensionPage.close();
};

basePjsTest.describe('XCM SDK - Asset claim', () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto('/xcm-sdk-sandbox');
  });

  supportedChains.forEach((chain) => {
    basePjsTest(`Should succeed for ${chain} asset claim`, async () => {
      await performAssetClaim(appPage, extensionPage, chain, {
        useApi: false,
      });
    });

    basePjsTest(`Should succeed for ${chain} asset claim - API`, async () => {
      await performAssetClaim(appPage, extensionPage, chain, {
        useApi: true,
      });
    });
  });
});
