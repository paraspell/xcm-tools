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
import ParachainNode from '../ParachainNode'

class Crust<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Crust', 'crustParachain', 'polkadot', Version.V3)
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
    const { api, asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(asset.assetId),
        target: { Id: address },
        amount: asset.amount
      }
    })
  }
}

export default Crust
