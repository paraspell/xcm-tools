import { ParaSpellError } from '@paraspell/sdk-common'

export class AmountTooLowError extends ParaSpellError {
  constructor(message?: string) {
    super(
      message ?? 'Entered amount is too low and cannot cover fees. Please enter a larger amount.'
    )
  }
}
