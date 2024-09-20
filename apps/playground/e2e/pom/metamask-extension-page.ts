import { Locator, Page } from "@playwright/test";

/*
Code inspired by https://github.com/UniqueNetwork/client-tests-template
*/

export class MetamaskExtensionPage {
  readonly page: Page;
  readonly metamaskExtensionCard: Locator;
  readonly firstTimeFlowButton: Locator;
  readonly declineDataCollectionButton: Locator;
  readonly agreeToTermsCheckbox: Locator;
  readonly confirmMnemonicButton: Locator;
  readonly cancelButton: Locator;
  readonly importWalletButton: Locator;
  readonly newPasswordField: Locator;
  readonly repeatPasswordField: Locator;
  readonly agreementCheckbox: Locator;
  readonly confirmButton: Locator;
  readonly completeButton: Locator;
  readonly nextButton: Locator;
  readonly doneButton: Locator;
  readonly connectNextButton: Locator;
  readonly connectConfirmButton: Locator;
  extensionId: string;

  constructor(page: Page) {
    this.page = page;
    this.metamaskExtensionCard = page.locator("#detailsButton");
    this.agreeToTermsCheckbox = page.locator(
      '[data-testid="onboarding-terms-checkbox"]'
    );
    this.declineDataCollectionButton = page.locator(
      '[data-testid="metametrics-no-thanks"]'
    );
    this.firstTimeFlowButton = page.locator(
      '[data-testid="first-time-flow__button"]'
    );
    this.cancelButton = page.locator(
      '[data-testid="page-container-footer-cancel"]'
    );
    this.confirmMnemonicButton = page.locator(
      '[data-testid="import-srp-confirm"]'
    );
    this.importWalletButton = page.locator(
      '[data-testid="onboarding-import-wallet"]'
    );
    this.newPasswordField = page.locator('[data-testid="create-password-new"]');
    this.repeatPasswordField = page.locator(
      '[data-testid="create-password-confirm"]'
    );
    this.agreementCheckbox = page.locator(
      '[data-testid="create-password-terms"]'
    );
    this.confirmButton = page.locator('[data-testid="create-password-import"]');
    this.completeButton = page.locator(
      '[data-testid="onboarding-complete-done"]'
    );
    this.nextButton = page.locator('[data-testid="pin-extension-next"]');
    this.doneButton = page.locator('[data-testid="pin-extension-done"]');
    this.connectNextButton = page.locator(
      '[data-testid="page-container-footer-next"]'
    );
    this.connectConfirmButton = page.locator(
      '[data-testid="page-container-footer-next"]'
    );
  }

  async firstOpen() {
    await this.navigate();
  }

  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState();
  }

  async navigate() {
    if (!this.extensionId) {
      await this.retrieveExtensionId();
    }
    await this.page.goto(
      `chrome-extension://${this.extensionId}/notification.html`
    );
    await this.page.waitForLoadState();
  }

  async retrieveExtensionId() {
    await this.page.goto("chrome://extensions/");
    await this.metamaskExtensionCard.click();
    await this.page.waitForLoadState();
    this.extensionId = new URL(this.page.url()).searchParams.get(
      "id"
    ) as string;
  }

  async connectAccountByExtension(mnemonic: string, password: string) {
    await this.retrieveExtensionId();
    await this.page.goto(
      `chrome-extension://${this.extensionId}/home.html#initialize/welcome`
    );
    await this.agreeToTermsCheckbox.click();
    await this.importWalletButton.click();
    await this.declineDataCollectionButton.click();
    await this.fillFieldsWithMnemonic(mnemonic);
    await this.confirmMnemonicButton.click();
    await this.newPasswordField.fill(password);
    await this.repeatPasswordField.fill(password);
    await this.agreementCheckbox.click();
    await this.confirmButton.click();
    await this.completeButton.click();
    await this.nextButton.click();
    await this.doneButton.click();
  }

  async fillFieldsWithMnemonic(mnemonic: string) {
    const arr = mnemonic.split(" ");
    for (let i = 0; i < 12; i++) {
      await this.page.locator(`[id="import-srp__srp-word-${i}"]`).fill(arr[i]);
    }
  }

  async connectToTheSite() {
    await this.connectNextButton.click();
    await this.connectConfirmButton.click();
  }
}
