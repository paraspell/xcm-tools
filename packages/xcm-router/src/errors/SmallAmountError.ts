export class SmallAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmallAmountError';
  }
}
