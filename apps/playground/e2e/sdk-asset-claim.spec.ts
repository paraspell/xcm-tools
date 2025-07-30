import { Page } from "@playwright/test";
import { basePjsTest, setupPolkadotExtension } from "./basePjsTest";
import { PolkadotjsExtensionPage } from "./pom";
import { TNodeDotKsmWithRelayChains } from "@paraspell/sdk";

const supportedNodes = [
  "Polkadot",
  "Kusama",
  "AssetHubPolkadot",
  "AssetHubKusama",
] as TNodeDotKsmWithRelayChains[];

const performAssetClaim = async (
  appPage: Page,
  extensionPage: PolkadotjsExtensionPage,
  node: TNodeDotKsmWithRelayChains,
  {
    useApi,
  }: {
    useApi: boolean;
  }
) => {
  await appPage.getByTestId("tab-asset-claim").click();

  await appPage.getByTestId("select-origin").click();
  await appPage.getByRole("option", { name: node, exact: true }).click();

  if (useApi) {
    await appPage.getByTestId("checkbox-api").click();
  }

  await appPage.getByTestId("submit").click();

  await appPage.waitForTimeout(3000);
  await extensionPage.navigate();
  await extensionPage.isPopupOpen();

  await extensionPage.close();
};

basePjsTest.describe("XCM SDK - Asset claim", () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto("/xcm-sdk-sandbox");
  });

  supportedNodes.forEach((node) => {
    basePjsTest(`Should succeed for ${node} asset claim`, async () => {
      await performAssetClaim(appPage, extensionPage, node, {
        useApi: false,
      });
    });

    basePjsTest(`Should succeed for ${node} asset claim - API`, async () => {
      await performAssetClaim(appPage, extensionPage, node, { 
        useApi: true,
       });
    });
  });
});
