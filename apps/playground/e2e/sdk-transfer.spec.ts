import { expect, Page } from "@playwright/test";
import { basePjsTest, setupPolkadotExtension } from "./basePjsTest";
import { PolkadotjsExtensionPage } from "./pom";
import {
  NODES_WITH_RELAY_CHAINS,
  getRelayChainSymbol,
  TNodeWithRelayChains,
  getAllAssetsSymbols,
  TNode,
  NODE_NAMES_DOT_KSM,
} from "@paraspell/sdk";

const excludedNodes = new Set([
  "Quartz",
  "Bitgreen",
  "Bajun",
  "CoretimeKusama",
]);

const nodes = NODES_WITH_RELAY_CHAINS.filter(
  (node) => !excludedNodes.has(node)
);

function getRelayChainForNode(node: TNodeWithRelayChains): string {
  return getRelayChainSymbol(node) === "DOT" ? "Polkadot" : "Kusama";
}

const getAssetsForNode = (node: TNodeWithRelayChains): string[] => {
  if (node === "Pendulum") return ["PEN"];
  if (node === "Nodle") return ["NODL"];
  if (node === "Crust") return ["EQD"];
  if (node === "CrustShadow") return ["KAR"];
  if (node === "Khala") return ["PHA"];
  if (node === "Phala") return ["PHA"];
  if (node === "Mythos") return ["MYTH"];
  return getAllAssetsSymbols(node);
};

const findTransferableNode = (
  from: TNodeWithRelayChains
): TNode | undefined => {
  const allFromAssets = getAssetsForNode(from);

  const nodeTo = NODE_NAMES_DOT_KSM.filter(
    (node) => getRelayChainSymbol(node) === getRelayChainSymbol(from)
  ).find((node) => {
    const nodeAssets = getAllAssetsSymbols(node);
    const commonAsset = nodeAssets.filter((asset) =>
      allFromAssets.includes(asset)
    )[0];
    return commonAsset !== undefined;
  });

  return nodeTo;
};

nodes.forEach((node) => {
  const relayChain = getRelayChainForNode(node);
  if (!relayChain) return;
  const anotherParaNode = findTransferableNode(node);
  if (!anotherParaNode) return;

  basePjsTest.describe(`XCM SDK - Transfer for node ${node}`, () => {
    let appPage: Page;
    let extensionPage: PolkadotjsExtensionPage;

    basePjsTest.beforeAll(async ({ context }) => {
      ({ appPage, extensionPage } = await setupPolkadotExtension(context));
      await appPage.goto("/xcm-sdk-sandbox");
    });

    basePjsTest.beforeEach(async () => {
      await appPage.reload();
    });

    basePjsTest(
      `Should succeed for ParaToPara transfer ${node} -> ${anotherParaNode}`,
      async () => {
        await appPage.getByTestId("select-origin").click();
        await appPage.getByRole("option", { name: node, exact: true }).click();

        await appPage.getByTestId("select-destination").click();
        await appPage
          .getByRole("option", { name: anotherParaNode, exact: true })
          .click();

        await appPage.getByTestId("select-currency").click();
        await appPage.getByRole("option").first().click();

        await appPage.getByTestId("submit").click();

        await appPage.waitForTimeout(3000);
        const error = appPage.getByTestId("error");
        await expect(
          error,
          (await error.isVisible()) ? await error.innerText() : ""
        ).not.toBeVisible();

        await extensionPage.navigate();
        await extensionPage.isPopupOpen();
        await extensionPage.close();
      }
    );

    if (!["Crust", "CrustShadow", "Phala", "Khala"].includes(node)) {
      basePjsTest(
        `Should succeed for ParaToRelay transfer ${node} -> ${relayChain}`,
        async () => {
          await appPage.getByTestId("select-origin").click();
          await appPage
            .getByRole("option", { name: node, exact: true })
            .click();

          await appPage.getByTestId("select-destination").click();
          await appPage
            .getByRole("option", { name: relayChain, exact: true })
            .click();

          await appPage.getByTestId("submit").click();

          await appPage.waitForTimeout(3000);
          const error = appPage.getByTestId("error");
          await expect(
            error,
            (await error.isVisible()) ? await error.innerText() : ""
          ).not.toBeVisible();

          await extensionPage.navigate();
          await extensionPage.isPopupOpen();
          await extensionPage.close();
        }
      );
    }

    basePjsTest(
      `Should succeed for RelayToPara transfer ${relayChain} -> ${node}`,
      async () => {
        await appPage.getByTestId("select-origin").click();
        await appPage
          .getByRole("option", { name: relayChain, exact: true })
          .click();

        await appPage.getByTestId("select-destination").click();
        await appPage.getByRole("option", { name: node, exact: true }).click();

        await appPage.getByTestId("submit").click();

        await appPage.waitForTimeout(3000);
        const error = appPage.getByTestId("error");
        await expect(
          error,
          (await error.isVisible()) ? await error.innerText() : ""
        ).not.toBeVisible();

        await extensionPage.navigate();
        await extensionPage.isPopupOpen();
        await extensionPage.close();
      }
    );
  });
});
