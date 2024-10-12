/**
 * Used to inform user, that Parachain they wish to use is not supported yet
 */
export class NodeNotSupportedError extends Error {
  /**
   * Constructs a new NodeNotSupportedError.
   *
   * @param message - Optional custom error message.
   */
  constructor(message?: string) {
    super(message ?? 'These nodes do not support XCM transfers from Relay / to Relay chain.')
    this.name = 'NodeNotSupported'
  }
}
