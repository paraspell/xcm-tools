import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a custom chain name collides with a built-in chain.
 */
export class CustomChainConflictError extends ParaSpellError {
  constructor(msg: string) {
    super(msg)
  }
}
