import { InvalidCurrencyError } from '../../errors'
import { type IXTransferTransfer, Version, type XTransferTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTransferTransferImpl from '../xTransfer'

class Khala<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTransferTransfer {
  constructor() {
    super('Khala', 'khala', 'kusama', Version.V3)
  }

  transferXTransfer<TApi, TRes>(input: XTransferTransferInput<TApi, TRes>) {
    const { currency } = input
    if (currency !== 'PHA') {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${currency}`)
    }
    return XTransferTransferImpl.transferXTransfer(input)
  }
}

export default Khala
