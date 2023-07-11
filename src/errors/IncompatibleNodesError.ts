export class IncompatibleNodesError extends Error {
  constructor() {
    super('Transactions between nodes on different relaychains are not yet possible.')
    this.name = 'IncompatibleNodes'
  }
}
