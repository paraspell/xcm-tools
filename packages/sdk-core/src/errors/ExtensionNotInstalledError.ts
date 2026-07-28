import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when an extension is not installed.
 */
export class ExtensionNotInstalledError extends ParaSpellError {
  /**
   * Constructs a new ExtensionNotInstalledError.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message)
  }
}
