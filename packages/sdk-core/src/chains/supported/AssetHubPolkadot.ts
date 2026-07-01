// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { isAssetEqual, isSymbolMatch } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { hasJunction, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { handleExecuteTransfer } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'

class AssetHubPolkadot<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'AssetHubPolkadot',
    info: string = 'PolkadotAssetHub',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  shouldUseExecuteTransfer(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): boolean {
    const { api, assetInfo, feeAssetInfo, overriddenAsset } = options

    if (!feeAssetInfo || overriddenAsset) return false
    if (isSymbolMatch(assetInfo.symbol, 'KSM')) return false

    const nativeAsset = api.findNativeAssetInfoOrThrow(this.chain)
    const isNativeAsset = isAssetEqual(nativeAsset, assetInfo)
    const isNativeFeeAsset = isAssetEqual(nativeAsset, feeAssetInfo)

    return !isNativeAsset || !isNativeFeeAsset
  }

  async transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { api } = options

    if (this.shouldUseExecuteTransfer(options)) {
      return api.deserializeExtrinsics(await handleExecuteTransfer(options))
    }

    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    if (asset.assetId !== undefined) {
      const assetId = Number(asset.assetId)
      const dest = { Id: recipient }
      if (isAmountAll) {
        return api.deserializeExtrinsics({
          module: 'Assets',
          method: 'transfer_all',
          params: {
            id: assetId,
            dest,
            keep_alive: keepAlive
          }
        })
      }

      return api.deserializeExtrinsics({
        module: 'Assets',
        method: keepAlive ? 'transfer_keep_alive' : 'transfer',
        params: {
          id: assetId,
          target: dest,
          amount: asset.amount
        }
      })
    }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'ForeignAssets',
        method: 'transfer_all',
        params: {
          id: asset.location,
          dest: { Id: recipient },
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'ForeignAssets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id: asset.location,
        target: { Id: recipient },
        amount: asset.amount
      }
    })
  }

  getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const ASSETS_PALLET_ID = 50

    const hasRequiredJunctions =
      hasJunction(asset.location, 'PalletInstance', ASSETS_PALLET_ID) &&
      hasJunction(asset.location, 'GeneralIndex') &&
      !hasJunction(asset.location, 'GlobalConsensus')

    if (hasRequiredJunctions) {
      return getPalletInstance('Assets').getBalance(api, address, asset)
    }

    return getPalletInstance('ForeignAssets').getBalance(api, address, asset)
  }
}

export default AssetHubPolkadot
