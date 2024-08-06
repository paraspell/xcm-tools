export class IncompatibleNodesError extends Error {
  constructor(message?: string) {
    super(message ?? 'Transactions between nodes on different relaychains are not yet possible.')
    this.name = 'IncompatibleNodes'
  }
}
