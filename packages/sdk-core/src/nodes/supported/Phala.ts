import { InvalidCurrencyError } from '@paraspell/assets'

import XTransferTransferImpl from '../../pallets/xTransfer'
import { type IXTransferTransfer, type TXTransferTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

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
