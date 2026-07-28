import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when routing or path resolution fails.
 */
export class RoutingResolutionError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
