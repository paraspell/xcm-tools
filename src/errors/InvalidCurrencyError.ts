// Used to inform user, that currency they wish to use is not registered on either origin or destination Parachain

export class InvalidCurrencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCurrencyError'
  }
}
