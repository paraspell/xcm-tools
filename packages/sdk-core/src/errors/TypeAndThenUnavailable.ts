export class TypeAndThenUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TypeAndThenUnavailableError'
  }
}
