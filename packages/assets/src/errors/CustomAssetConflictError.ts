import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a custom asset's location collides with an existing
 * registry asset and `forceOverride` was not set.
 */
export class CustomAssetConflictError extends ParaSpellError {
  constructor(msg: string) {
    super(msg)
  }
}
