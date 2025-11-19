import path from "path";
import { fileURLToPath } from "url";

import { BrowserContext, chromium, test } from "@playwright/test";
import { PolkadotjsExtensionPage } from "./pom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const polkadotExtensionPath = path.join(
  __dirname,
  "extensions",
  "polkadot-ext",
  "packages",
  "extension",
  "build"
);

const polkaAccount = {
  mnemonic:
    "leg observe column teach until outside since school october dinner impact title",
  password: "1234qwe",
  name: "ExtensionUser",
};

export const basePjsTest = test.extend({
  context: async ({}, use) => {
    const launchOptions = {
      devtools: false,
      headless: false,
      args: [
        `--disable-extensions-except=${polkadotExtensionPath}`,
        `--load-extension=${polkadotExtensionPath}`,
      ],
    };
    const context = await chromium.launchPersistentContext("", launchOptions);
    await use(context);
  },
});

export const setupPolkadotExtension = async (context: BrowserContext) => {
  const appPage = await context.newPage();
  await appPage.goto("/");

  const extensionPage = new PolkadotjsExtensionPage(await context.newPage());
  await extensionPage.firstOpen();
  await extensionPage.connectAccountByExtension(
    polkaAccount.mnemonic,
    polkaAccount.password,
    polkaAccount.name
  );

  await appPage.bringToFront();

  await appPage.reload();

  await appPage.getByRole('main').getByTestId('btn-connect-wallet').click();
  await appPage.getByRole('button', { name: 'Polkadot{.js}' }).click();

  await extensionPage.connectAccountToHost();

  await appPage.getByTestId("btn-account-confirm").click();

  return { appPage, extensionPage };
};
