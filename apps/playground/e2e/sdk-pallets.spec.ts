import { test, expect, Page } from "@playwright/test";
import { NODE_NAMES_DOT_KSM } from "@paraspell/sdk";

const performPalletTest = async (
  page: Page,
  funcName: string,
  nodeName: string,
  useApi: boolean
) => {
  await page.goto("/xcm-sdk-sandbox");

  await page.getByTestId("tab-pallets").click();

  await page.getByTestId("select-node").click();
  await page.getByRole("option", { name: nodeName, exact: true }).click();

  if (useApi) {
    await page.getByTestId("checkbox-api").check();
  }

  await page.getByTestId("select-func").click();
  await page.getByRole("option", { name: funcName, exact: true }).click();

  await page.getByTestId("submit").click();

  await expect(page.getByTestId("error")).not.toBeVisible();
  await expect(page.getByTestId("output")).toBeVisible();
};

const palletFunctions = ["ALL_PALLETS", "DEFAULT_PALLET"];

test.describe.configure({ mode: "parallel" });

test.describe("XCM SDK - Pallets", () => {
  palletFunctions.forEach((funcName) => {
    NODE_NAMES_DOT_KSM.forEach((nodeName) => {
      [false, true].forEach((useApi) => {
        const apiLabel = useApi ? " - API" : "";
        test(`Should succeed for ${funcName} function for ${nodeName}${apiLabel}`, async ({
          page,
        }) => {
          await performPalletTest(page, funcName, nodeName, useApi);
        });
      });
    });
  });
});
