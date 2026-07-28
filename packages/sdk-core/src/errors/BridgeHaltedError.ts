import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when the Ethereum bridge is halted.
 */
export class BridgeHaltedError extends ParaSpellError {
  /**
   * Constructs a new BridgeHaltedError.
   *
   * @param message - Optional custom error message.
   */
  constructor() {
    super('Bridge operations have been paused by onchain governance.')
  }
}
