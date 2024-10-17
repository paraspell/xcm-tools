import { InvalidCurrencyError } from '../../errors'
import { type IXTransferTransfer, Version, type XTransferTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTransferTransferImpl from '../xTransfer'

class Phala<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTransferTransfer {
  constructor() {
    super('Phala', 'phala', 'polkadot', Version.V3)
  }

  transferXTransfer<TApi, TRes>(input: XTransferTransferInput<TApi, TRes>) {
    const { currency } = input
    if (currency !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${currency}`)
    }
    return XTransferTransferImpl.transferXTransfer(input)
  }
}

export default Phala
