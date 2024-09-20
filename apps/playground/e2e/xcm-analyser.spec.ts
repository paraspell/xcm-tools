import { test, expect } from "@playwright/test";

test.describe("XCM Analyser", () => {
  test("Shoud succeed for valid Multi-location", async ({ page }) => {
    await page.goto("/xcm-analyser-sandbox");

    const validMultiLocation = {
      parents: 1,
      interior: {
        X1: [
          {
            Parachain: 3000,
          },
        ],
      },
    };

    await page.getByTestId("input").fill(JSON.stringify(validMultiLocation));

    await page.getByTestId("submit").click();

    await expect(page.getByTestId("output")).toBeVisible();
  });

  test("Shoud fail for invalid Multi-location", async ({ page }) => {
    await page.goto("/xcm-analyser-sandbox");

    const invalidMultiLocation = {
      parents: 1,
      interior: {
        X9: [
          {
            Parachain: 3000,
          },
        ],
      },
    };

    await page.getByTestId("input").fill(JSON.stringify(invalidMultiLocation));

    await page.getByTestId("submit").click();

    await expect(page.getByTestId("output")).not.toBeVisible();
    await expect(page.getByTestId("error")).toBeVisible();
  });
});
