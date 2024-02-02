export class MissingApiPromiseError extends Error {
  constructor() {
    super('Please provide ApiPromise instance.')
    this.name = 'MissingApiPromise'
  }
}
