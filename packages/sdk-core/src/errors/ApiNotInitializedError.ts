import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when an API operation is attempted before the API has been initialized.
 */
export class ApiNotInitializedError extends ParaSpellError {
  constructor() {
    super('API is not initialized. Please call init() before using this method.')
  }
}
