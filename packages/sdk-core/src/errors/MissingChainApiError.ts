import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

/**
 * Error development mode is on and no API override is provided for a specific chain.
 */
export class MissingChainApiError extends Error {
  /**
   * Constructs a new MissingChainApiError.
   *
   * @param chain - The node for which the API is missing.
   */
  constructor(chain: TNodeWithRelayChains) {
    super(
      `Development mode requires an API override for ${chain}. ` +
        `Please provide an API client or WebSocket URL in the apiOverrides configuration.`
    )
    this.name = 'MissingChainApiError'
  }
}
