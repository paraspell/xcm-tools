//Used to inform user, that Parachain they wish to use has not yet implemented full XCM Support

import { TNode } from '../types'

export class NoXCMSupportImplementedError extends Error {
  constructor(node: TNode) {
    super(`No XCM support implemented for ${node} node yet.`)
    this.name = 'NoXCMSupportImplemented'
  }
}
