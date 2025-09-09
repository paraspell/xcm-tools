export class AmountTooLowError extends Error {
  constructor(message?: string) {
    super(
      message ?? 'Entered amount is too low and cannot cover fees. Please enter a larger amount.'
    )
    this.name = 'AmountTooLowError'
  }
}
