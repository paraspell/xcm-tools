import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Used to inform user, that currency they wish to use is not registered on either origin or destination Parachain
 */
export class InvalidCurrencyError extends ParaSpellError {
  /**
   * Constructs a new InvalidCurrencyError.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message)
  }
}
