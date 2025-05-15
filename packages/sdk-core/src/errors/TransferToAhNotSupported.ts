export class TransferToAhNotSupported extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'TransferToAhNotSupported'
  }
}
