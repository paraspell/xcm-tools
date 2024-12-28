import { InvalidCurrencyError } from '../../errors'
import { type IXTransferTransfer, Version, type TXTransferTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'
import XTransferTransferImpl from '../../pallets/xTransfer'

class Phala<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTransferTransfer {
  constructor() {
    super('Phala', 'phala', 'polkadot', Version.V3)
  }

  transferXTransfer<TApi, TRes>(input: TXTransferTransferOptions<TApi, TRes>) {
    const { asset } = input
    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${asset.symbol}`)
    }
    return XTransferTransferImpl.transferXTransfer(input)
  }
}

export default Phala
