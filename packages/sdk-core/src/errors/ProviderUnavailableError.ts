import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when no provider or RPC endpoint is available for the requested chain.
 */
export class ProviderUnavailableError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
