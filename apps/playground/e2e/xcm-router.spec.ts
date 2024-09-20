import { expect, Page } from "@playwright/test";
import { basePjsTest, setupPolkadotExtension } from "./basePjsTest";
import { PolkadotjsExtensionPage } from "./pom";

const exchanges = [
  {
    exchange: "HydrationDex",
    fromNode: "Astar",
    toNode: "BifrostPolkadot",
    fromCurrency: "ASTR - 1333",
    toCurrency: "DOT - Native",
  },
  {
    exchange: "BasiliskDex",
    fromNode: "Karura",
    toNode: "AssetHubKusama",
    fromCurrency: "TEER - 8",
    toCurrency: "KSM - Native",
  },
  {
    exchange: "KaruraDex",
    fromNode: "AssetHubKusama",
    toNode: "BifrostKusama",
    fromCurrency: "KSM - 1234",
    toCurrency: "RMRK - 8",
  },
  {
    exchange: "AcalaDex",
    fromNode: "Astar",
    toNode: "Unique",
    fromCurrency: "aSEED - 18446744073709551617",
    toCurrency: "DOT - Native",
  },
  {
    exchange: "KintsugiDex",
    fromNode: "Karura",
    toNode: "Moonriver",
    fromCurrency: "KINT - Native",
    toCurrency: "KSM - Native",
  },
  {
    exchange: "InterlayDex",
    fromNode: "Hydration",
    toNode: "Moonbeam",
    fromCurrency: "HDX - Native",
    toCurrency: "DOT - Native",
  },
  {
    exchange: "BifrostKusamaDex",
    fromNode: "AssetHubKusama",
    toNode: "Basilisk",
    fromCurrency: "USDT - 11",
    toCurrency: "KSM - Native",
  },
  {
    exchange: "BifrostPolkadotDex",
    fromNode: "Hydration",
    toNode: "Acala",
    fromCurrency: "vDOT - 15",
    toCurrency: "DOT - Native",
  },
];

const transferTypes = [
  "TO_EXCHANGE",
  "TO_DESTINATION",
  "SWAP",
  "FULL_TRANSFER",
];

basePjsTest.describe("RouterTransferForm E2E Tests", () => {
  let appPage: Page;
  let extensionPage: PolkadotjsExtensionPage;

  basePjsTest.beforeAll(async ({ context }) => {
    ({ appPage, extensionPage } = await setupPolkadotExtension(context));
  });

  basePjsTest.beforeEach(async () => {
    await appPage.goto("/");
  });

  exchanges.map(({ exchange, fromNode, toNode, fromCurrency, toCurrency }) => {
    transferTypes.map((transferType) => {
      const performTest = async ({ useApi }: { useApi: boolean }) => {
        await appPage.getByTestId("select-from").click();
        await appPage
          .getByRole("option", { name: fromNode, exact: true })
          .click();

        await appPage.getByTestId("select-exchange").click();
        await appPage
          .getByRole("option", { name: exchange, exact: true })
          .click();

        await appPage.getByTestId("select-to").click();
        await appPage
          .getByRole("option", { name: toNode, exact: true })
          .click();

        await appPage.getByTestId("select-currency-from").click();
        await appPage
          .getByRole("option", {
            name: fromCurrency,
            exact: true,
          })
          .click();

        await appPage.getByTestId("select-currency-to").click();
        await appPage
          .getByRole("option", {
            name: toCurrency,
            exact: true,
          })
          .click();
        await appPage
          .getByTestId("input-recipient-address")
          .fill("5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96");

        await appPage.getByTestId("input-amount").fill("10000000000000000000");

        await appPage.getByTestId("select-transaction-type").click();
        await appPage
          .getByRole("option", { name: transferType, exact: true })
          .click();

        await appPage.getByTestId("input-slippage-pct").fill("1");

        if (useApi) {
          await appPage.getByTestId("checkbox-api").click();
        }

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
      };

      basePjsTest(
        `Exchange: ${exchange} - Transfer type: ${transferType}`,
        async () => {
          await performTest({ useApi: false });
        }
      );

      basePjsTest(
        `Exchange: ${exchange} - Transfer type: ${transferType} - API`,
        async () => {
          await performTest({ useApi: true });
        }
      );
    });
  });
});
