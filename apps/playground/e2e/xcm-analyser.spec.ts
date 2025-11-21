import { test, expect } from '@playwright/test';

test.describe('XCM Analyser', () => {
  [true, false].forEach((useApi) => {
    const apiLabel = useApi ? ' - API' : ''

  test(`Shoud succeed for valid location${apiLabel}`, async ({ page }) => {
    await page.goto('/xcm-analyser');

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

    if (useApi) {
      await page.getByTestId('checkbox-api').click();
    }

    await page.getByTestId('submit').click();

    await expect(page.getByTestId('output')).toBeVisible();
  });

  test(`Shoud fail for invalid location${apiLabel}`, async ({ page }) => {
    await page.goto('/xcm-analyser');

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

    if (useApi) {
      await page.getByTestId('checkbox-api').click();
    }

    await page.getByTestId('submit').click();

    await expect(page.getByTestId('output')).not.toBeVisible();
    await expect(page.getByTestId('error')).toBeVisible();
  });
})
});
