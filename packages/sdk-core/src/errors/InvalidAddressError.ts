import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when an invalid address is provided.
 */
export class InvalidAddressError extends ParaSpellError {
  /**
   * Constructs a new InvalidAddressError.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message)
  }
}
