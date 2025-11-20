import { expect, Locator, Page } from "@playwright/test";

/*
Code inspired by https://github.com/UniqueNetwork/client-tests-template
*/

export class PolkadotjsExtensionPage {
  page: Page;
  readonly confirmButton: Locator;
  readonly acceptButton: Locator;
  readonly importAccountFromSeedRow: Locator;
  readonly importAccountInput: Locator;
  readonly addAccountIcon: Locator;
  readonly fullAddress: Locator;
  readonly nextStepButton: Locator;
  readonly addAccountButton: Locator;
  readonly nameInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly polkadotExtensionCard: Locator;
  readonly selectAllCheckbox: Locator;
  readonly confirmPrivacyOrMigrationNoticeButton: Locator;
  extensionId: string;

  constructor(page: Page) {
    this.page = page;
    this.confirmButton = page.locator("//button");
    this.acceptButton = page.locator(
      '//button[contains(@class, "acceptButton")]'
    );
    this.addAccountIcon = page.locator(
      '//div[contains(@class, "popupToggle")][1]'
    );
    this.importAccountFromSeedRow = page.locator(
      '//span[text()="Import account from pre-existing seed"]'
    );
    this.importAccountInput = page.locator("//textarea");
    this.fullAddress = page.locator('//div[@class="fullAddress"]');
    this.nextStepButton = page.locator(
      '//button[div[contains(text(), "Next")]]'
    );
    this.addAccountButton = page.locator(
      '//button[div[contains(text(), "Add the account with the supplied seed")]]'
    );
    this.nameInput = page.locator(
      '//label[text()="A descriptive name for your account"]/../input'
    );
    this.passwordInput = page.locator(
      '//label[text()="A new password for this account"]/../input'
    );
    this.repeatPasswordInput = page.locator(
      '//label[text()="Repeat password for verification"]/../input'
    );
    this.polkadotExtensionCard = page.locator("#detailsButton");
    this.selectAllCheckbox = page.locator("Select all");
    this.confirmPrivacyOrMigrationNoticeButton = page.getByRole('button', {
      name: /^(I Understand|Understood, let me continue)$/i
    });
  }

  async firstOpen() {
    await this.navigate();
    await this.clickConfirm();
  }

  async clickConfirm() {
    await this.confirmPrivacyOrMigrationNoticeButton.click({ force: true })
    await this.confirmButton.click({ force: true });
  }

  async clickAccept() {
    await this.acceptButton.click({ force: true });
  }

  async navigate() {
    if (!this.extensionId) {
      await this.retrieveExtensionId();
    }
    if (this.page.isClosed()) {
      this.page = await this.page.context().newPage();
    }
    await this.page.goto(
      `chrome-extension://${this.extensionId}/notification.html`
    );
    await this.page.waitForLoadState();
  }

  async isPopupOpen() {
    await expect(
      this.page.locator(
        '//div[label[contains(text(), "Password for this account")]]//input'
      )
    ).toBeVisible();
  }

  async retrieveExtensionId() {
    await this.page.goto("chrome://extensions/");
    await this.polkadotExtensionCard.click();
    await this.page.waitForLoadState();
    this.extensionId = new URL(this.page.url()).searchParams.get(
      "id"
    ) as string;
  }

  async connectAccountByExtension(
    mnemonic: string,
    password: string,
    accountName: string
  ) {
    await this.addAccountIcon.click();
    await this.importAccountFromSeedRow.click();
    await this.importAccountInput.fill(mnemonic);
    await this.nextStepButton.click();
    await this.nameInput.fill(accountName);
    await this.passwordInput.fill(password);
    await this.repeatPasswordInput.fill(password);
    await this.addAccountButton.click();
  }

  async connectAccountToHost() {
    await this.page.locator("text=Select all").click();
    await this.page.getByRole('button', { name: 'Connect 1 account(s)' }).click();
  }

  async close() {
    await this.page.close();
  }
}
