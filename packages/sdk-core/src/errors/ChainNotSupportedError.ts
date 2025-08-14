/**
 * Used to inform user, that Parachain they wish to use is not supported yet
 */
export class ChainNotSupportedError extends Error {
  /**
   * Constructs a new ChainNotSupportedError.
   *
   * @param message - Optional custom error message.
   */
  constructor(message?: string) {
    super(message ?? 'These chains do not support XCM transfers from Relay / to Relay chain.')
    this.name = 'ChainNotSupported'
  }
}
