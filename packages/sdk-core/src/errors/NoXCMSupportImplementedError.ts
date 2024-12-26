import { type TNode } from '../types'

/**
 * Used to inform user, that Parachain they wish to use has not yet implemented full XCM Support
 */
export class NoXCMSupportImplementedError extends Error {
  /**
   * Constructs a new NoXCMSupportImplementedError.
   *
   * @param node - The node for which XCM support is not implemented.
   */
  constructor(node: TNode) {
    super(`No XCM support implemented for ${node} node yet.`)
    this.name = 'NoXCMSupportImplemented'
  }
}
