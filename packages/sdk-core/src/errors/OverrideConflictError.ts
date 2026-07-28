import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when asset or currency overrides are invalid or conflicting.
 */
export class OverrideConflictError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
