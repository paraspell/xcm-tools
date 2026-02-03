// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { type TAssetInfo } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import Chain from '../Chain'

class BifrostPolkadot<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'BifrostPolkadot',
    info: string = 'bifrost',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  getCustomCurrencyId(asset: TAssetInfo) {
    const nativeAssetSymbol = this.getNativeAssetSymbol()

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

  transferPolkadotXCM(options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { destination } = options

    if (destination === 'Ethereum') {
      return this.transferToEthereum(options)
    }

    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    const dest = { Id: address }
    const currencyId = this.getCustomCurrencyId(asset)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest,
          currency_id: currencyId,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: 'transfer',
      params: {
        dest,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default BifrostPolkadot
