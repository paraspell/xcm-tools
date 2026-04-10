import type { Page } from '@playwright/test';

type AcknowledgeTransferWarningOptions = {
  timeoutMs?: number;
  checkDontShowAgain?: boolean;
};

export const acknowledgeTransferWarningIfOpened = async (
  page: Page,
  options: AcknowledgeTransferWarningOptions = {},
) => {
  const { timeoutMs = 2500, checkDontShowAgain = true } = options;
  const acknowledgeButton = page.getByRole('button', { name: 'I understand' });

  try {
    await acknowledgeButton.waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    return false;
  }

  if (checkDontShowAgain) {
    const dontShowAgainCheckbox = page.getByLabel('Do not show again');
    if (await dontShowAgainCheckbox.isVisible()) {
      await dontShowAgainCheckbox.check({ force: true });
    }
  }

  await acknowledgeButton.click();
  return true;
};
