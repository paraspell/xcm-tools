import { test, expect } from '@playwright/test';

test.describe('XCM Analyser', () => {
  test('Shoud succeed for valid location', async ({ page }) => {
    await page.goto('/xcm-analyser-sandbox');

    const validLocation = {
      parents: 1,
      interior: {
        X1: [
          {
            Parachain: 3000,
          },
        ],
      },
    };

    await page.getByTestId('input').fill(JSON.stringify(validLocation));

    await page.getByTestId('submit').click();

    await expect(page.getByTestId('output')).toBeVisible();
  });

  test('Shoud fail for invalid location', async ({ page }) => {
    await page.goto('/xcm-analyser-sandbox');

    const invalidLocation = {
      parents: 1,
      interior: {
        X9: [
          {
            Parachain: 3000,
          },
        ],
      },
    };

    await page.getByTestId('input').fill(JSON.stringify(invalidLocation));

    await page.getByTestId('submit').click();

    await expect(page.getByTestId('output')).not.toBeVisible();
    await expect(page.getByTestId('error')).toBeVisible();
  });
});
