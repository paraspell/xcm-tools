/**
 * Error thrown when a feature or route is temporarily disabled via configuration or governance.
 */
export class FeatureTemporarilyDisabledError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FeatureTemporarilyDisabledError'
  }
}
