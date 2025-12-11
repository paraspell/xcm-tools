/**
 * Error thrown when routing or path resolution fails.
 */
export class RoutingResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RoutingResolutionError'
  }
}
