// Contains detailed structure of XCM call construction for Interlay Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions
} from '../../types'
import SubstrateChain from '../SubstrateChain'

class Interlay<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IXTokensTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Interlay', 'interlay', 'Polkadot', Version.V3)
  }

  getCustomCurrencyId(
    _api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TForeignOrTokenAsset {
    return asset.isNative ? { Token: asset.symbol } : { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner, TCustomChain>) {
    const { asset, api } = input
    const currencySelection = this.getCustomCurrencyId(api, asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return Promise.resolve(this.transferLocalNonNativeAsset(options))
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    const currencyId = this.getCustomCurrencyId(api, asset)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: recipient,
          currency_id: currencyId,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        dest: recipient,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }

  getBalanceNative(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return this.getBalanceForeign(api, address, asset)
  }
}

export default Interlay
