import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import XTransferTransferImpl from '../../pallets/xTransfer'
import type { TTransferLocalOptions } from '../../types'
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

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (asset.assetId === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(asset.assetId),
        target: { Id: address },
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Phala
