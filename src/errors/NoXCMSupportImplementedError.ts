import { TNode } from '../types'

export class NoXCMSupportImplementedError extends Error {
  constructor(node: TNode) {
    super(`No XCM support implemented for ${node} node yet.`)
    this.name = 'NoXCMSupportImplemented'
  }
}
