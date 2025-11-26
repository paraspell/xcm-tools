// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import {
  findAssetInfoByLoc,
  getOtherAssets,
  isForeignAsset,
  type TAssetInfo
} from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import Parachain from '../Parachain'

class BifrostPolkadot<TApi, TRes>
  extends Parachain<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
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

    if (!isForeignAsset(asset) || (isForeignAsset(asset) && !asset.assetId)) {
      return isVToken ? { VToken: asset.symbol.substring(1) } : { Token: asset.symbol }
    }

    const id = Number(asset.assetId)
    if (isVSToken) {
      return { VSToken2: id }
    }

    return isVToken ? { VToken2: id } : { Token2: id }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection = this.getCustomCurrencyId(asset)
    return transferXTokens(input, currencySelection)
  }

  transferPolkadotXCM<TApi, TRes>(options: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destination } = options
    if (destination === 'Ethereum') {
      return this.transferToEthereum(options)
    }

    return transferPolkadotXcm(options, 'transfer_assets', 'Unlimited')
  }

  canUseXTokens({ assetInfo, to: destination }: TSendInternalOptions<TApi, TRes>): boolean {
    const isEthAsset =
      assetInfo.location && findAssetInfoByLoc(getOtherAssets('Ethereum'), assetInfo.location)
    if (isEthAsset) return false
    if (destination === 'Ethereum') return false
    return (
      (assetInfo.symbol !== 'WETH' && assetInfo.symbol !== 'DOT') ||
      destination !== 'AssetHubPolkadot'
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
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
