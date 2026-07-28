import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a feature or route is temporarily disabled via configuration or governance.
 */
export class FeatureTemporarilyDisabledError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
