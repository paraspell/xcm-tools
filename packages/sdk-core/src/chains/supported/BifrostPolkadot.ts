// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { type TAssetInfo } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TMintConfig,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import SubstrateChain from '../SubstrateChain'

class BifrostPolkadot<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'BifrostPolkadot',
    info: string = 'bifrost',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  getCustomCurrencyId(api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>, asset: TAssetInfo) {
    const nativeAssetSymbol = this.getNativeAssetSymbol(api)

    if (asset.symbol === nativeAssetSymbol) {
      return { Native: nativeAssetSymbol }
    }

    const isVToken = asset.symbol && asset.symbol.startsWith('v')
    const isVSToken = asset.symbol && asset.symbol.startsWith('vs')

    if (asset.isNative || (!asset.isNative && !asset.assetId)) {
      return isVToken ? { VToken: asset.symbol.substring(1) } : { Token: asset.symbol }
    }

    const id = Number(asset.assetId)
    if (isVSToken) {
      return { VSToken2: id }
    }

    return isVToken ? { VToken2: id } : { Token2: id }
  }

  protected getMintConfig(): TMintConfig {
    return { useCustomCurrencyId: true }
  }

  transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    const dest = { Id: recipient }
    const currencyId = this.getCustomCurrencyId(api, asset)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest,
          currency_id: currencyId,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        dest,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default BifrostPolkadot
