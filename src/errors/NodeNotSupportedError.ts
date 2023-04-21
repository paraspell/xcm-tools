export class NodeNotSupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NodeNotSupported'
  }
}
