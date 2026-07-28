import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a custom chain definition is missing required fields or
 * carries invalid values.
 */
export class CustomChainInvalidError extends ParaSpellError {
  constructor(msg: string) {
    super(msg)
  }
}
