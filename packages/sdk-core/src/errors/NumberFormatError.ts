import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when numeric input is invalid or cannot be parsed.
 */
export class NumberFormatError extends ParaSpellError {
  constructor(message: string = 'Input must be a valid number') {
    super(message)
  }
}
