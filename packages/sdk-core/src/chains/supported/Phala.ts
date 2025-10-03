import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { AMOUNT_ALL } from '../../constants'
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
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)
    const dest = { Id: address }

    if (asset.amount === AMOUNT_ALL) {
      return api.callTxMethod({
        module: 'Assets',
        method: 'transfer_all',
        parameters: {
          id: assetId,
          dest,
          amount: asset.amount
        }
      })
    }

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default Phala
