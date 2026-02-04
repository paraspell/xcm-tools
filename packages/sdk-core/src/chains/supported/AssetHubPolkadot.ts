// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, isSymbolMatch } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { hasJunction, Parents, Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TSerializedExtrinsics, TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { addXcmVersionHeader, assertHasLocation, assertSenderAddress } from '../../utils'
import { createAsset } from '../../utils/asset'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createBeneficiaryLocation, createVersionedDestination } from '../../utils/location'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'
import { handleExecuteTransfer } from '../../utils/transfer'
import Chain from '../Chain'
import { getParaId } from '../config'

class AssetHubPolkadot<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'AssetHubPolkadot',
    info: string = 'PolkadotAssetHub',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  public async handleEthBridgeNativeTransfer<TApi, TRes, TSigner>(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { api, version, destination, senderAddress, address, paraIdTo, assetInfo: asset } = input

    assertSenderAddress(senderAddress)

    assertHasLocation(asset)

    const messageId = await generateMessageId(
      api,
      senderAddress,
      getParaId(this.chain),
      JSON.stringify(asset.location),
      JSON.stringify(address),
      asset.amount
    )

    const location = asset.symbol === this.getNativeAssetSymbol() ? DOT_LOCATION : asset.location

    const call: TSerializedExtrinsics = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: {
        dest: createVersionedDestination(
          this.version,
          this.chain,
          destination,
          paraIdTo,
          getEthereumJunction(this.chain),
          Parents.TWO
        ),
        assets: addXcmVersionHeader([createAsset(version, asset.amount, location)], version),
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: addXcmVersionHeader(location, version),
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: addXcmVersionHeader(
          [
            {
              DepositAsset: {
                assets: { Wild: { AllCounted: 1 } },
                beneficiary: createBeneficiaryLocation({
                  api,
                  address,
                  version
                })
              }
            },
            {
              SetTopic: messageId
            }
          ],
          version
        ),
        weight_limit: 'Unlimited'
      }
    }

    return api.deserializeExtrinsics(call)
  }

  async transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { api, assetInfo, feeAssetInfo, overriddenAsset } = options

    if (feeAssetInfo) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden multi-assets with XCM execute')
      }

      if (isSymbolMatch(assetInfo.symbol, 'KSM')) {
        return transferPolkadotXcm(options)
      }

      const isNativeAsset = isSymbolMatch(assetInfo.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAssetInfo.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.deserializeExtrinsics(await handleExecuteTransfer(options))
      }
    }

    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    if (asset.assetId !== undefined) {
      const assetId = Number(asset.assetId)
      const dest = { Id: address }
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
          dest: { Id: address },
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'ForeignAssets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id: asset.location,
        target: { Id: address },
        amount: asset.amount
      }
    })
  }

  getBalanceForeign<TApi, TRes, TSigner>(
    api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const ASSETS_PALLET_ID = 50

    const hasRequiredJunctions =
      asset.location &&
      hasJunction(asset.location, 'PalletInstance', ASSETS_PALLET_ID) &&
      hasJunction(asset.location, 'GeneralIndex') &&
      !hasJunction(asset.location, 'GlobalConsensus')

    if (!asset.location || hasRequiredJunctions) {
      return getPalletInstance('Assets').getBalance(api, address, asset)
    }

    return getPalletInstance('ForeignAssets').getBalance(api, address, asset)
  }
}

export default AssetHubPolkadot
