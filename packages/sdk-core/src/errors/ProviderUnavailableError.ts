/**
 * Error thrown when no provider or RPC endpoint is available for the requested chain.
 */
export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProviderUnavailableError'
  }
}
