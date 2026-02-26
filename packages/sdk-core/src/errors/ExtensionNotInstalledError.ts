/**
 * Error thrown when an extension is not installed.
 */
export class ExtensionNotInstalledError extends Error {
  /**
   * Constructs a new ExtensionNotInstalledError.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message)
    this.name = 'ExtensionNotInstalledError'
  }
}
