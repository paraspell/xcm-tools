// Used to inform user, that Parachain they wish to use is not supported yet

export class NodeNotSupportedError extends Error {
  constructor(message?: string) {
    super(message ?? 'These nodes do not support XCM transfers from Relay / to Relay chain.')
    this.name = 'NodeNotSupported'
  }
}
