//Used to inform user, that Parachain they wish to use is not supported yet

export class NodeNotSupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NodeNotSupported'
  }
}
