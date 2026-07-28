import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a required runtime API is not available on the target chain.
 */
export class RuntimeApiUnavailableError extends ParaSpellError {
  constructor(chain: string, apiName: string) {
    super(`Runtime API "${apiName}" is not available on chain ${chain}`)
  }
}
