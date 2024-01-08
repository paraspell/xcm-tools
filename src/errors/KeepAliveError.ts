export class KeepAliveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KeepAliveError'
  }
}
