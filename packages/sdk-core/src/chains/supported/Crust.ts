// Contains detailed structure of XCM call construction for Crust Parachain

import { InvalidCurrencyError, isForeignAsset, type TAssetInfo } from '@paraspell/assets'
import { replaceBigInt, Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TReserveAsset,
  type TXTokensTransferOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Crust<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Crust', 'crustParachain', 'Polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAssetInfo): TReserveAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) {
      return 'SelfReserve'
    }

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset, replaceBigInt)} has no assetId`)
    }

    return { OtherReserve: BigInt(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)
    const dest = { Id: address }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: assetId,
          dest,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default Crust
