import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTransfer } from '../../pallets/xTransfer'
import type { TTransferLocalOptions } from '../../types'
import { type IXTransferTransfer, type TXTransferTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Phala<TApi, TRes> extends Parachain<TApi, TRes> implements IXTransferTransfer {
  constructor() {
    super('Phala', 'phala', 'Polkadot', Version.V3)
  }

  transferXTransfer<TApi, TRes>(input: TXTransferTransferOptions<TApi, TRes>) {
    const { asset } = input
    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Chain ${this.chain} does not support currency ${asset.symbol}`
      )
    }
    return transferXTransfer(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)
    const dest = { Id: address }

    const amount = isAmountAll ? options.balance : asset.amount

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount
      }
    })
  }
}

export default Phala
