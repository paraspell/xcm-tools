export class InvalidCurrencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCurrencyError'
  }
}
