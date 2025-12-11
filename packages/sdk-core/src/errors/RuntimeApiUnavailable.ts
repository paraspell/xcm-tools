/**
 * Error thrown when a required runtime API is not available on the target chain.
 */
export class RuntimeApiUnavailableError extends Error {
  constructor(chain: string, apiName: string) {
    super(`Runtime API "${apiName}" is not available on chain ${chain}`)
    this.name = 'RuntimeApiUnavailableError'
  }
}
