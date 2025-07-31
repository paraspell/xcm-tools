// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isSymbolMatch
} from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { hasJunction, Parents, type TMultiLocation, Version } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import { createVersionedDestination } from '../../pallets/xcmPallet/utils'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, createBeneficiaryLocation } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import { handleExecuteTransfer } from '../../utils/transfer'
import { getParaId } from '../config'
import ParachainNode from '../ParachainNode'
import { createTransferAssetsTransfer, createTypeAndThenTransfer } from './Polimec'

const createCustomXcmAh = <TApi, TRes>(
  { api, address }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: 2 } },
        beneficiary: createBeneficiaryLocation({
          api,
          address: address,
          version
        })
      }
    }
  ]
})

class Hydration<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  private static NATIVE_ASSET_ID = 0

  constructor(
    chain: TNodePolkadotKusama = 'Hydration',
    info: string = 'hydradx',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferToAssetHub<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): TRes {
    const { api, asset, version, destination } = input

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          version,
          this.node,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: {
          [version]: [createMultiAsset(version, asset.amount, DOT_MULTILOCATION)]
        },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: {
          [version]: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: createCustomXcmAh(input, version),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }

  transferToPolimec<TApi, TRes>(options: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { api, asset, version = this.version } = options
    const symbol = asset.symbol.toUpperCase()

    if (symbol === 'DOT') {
      const call = createTypeAndThenTransfer(options, version)
      return Promise.resolve(api.callTxMethod(call))
    }

    if (
      (symbol === 'USDC' || symbol === 'USDT') &&
      !hasJunction(
        asset.multiLocation as TMultiLocation,
        'Parachain',
        getParaId('AssetHubPolkadot')
      )
    ) {
      throw new InvalidCurrencyError('The selected asset is not supported for transfer to Polimec')
    }

    return createTransferAssetsTransfer(options, version)
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, destination, feeAsset, asset, overriddenAsset } = input

    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    if (feeAsset) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden multi-assets with XCM execute')
      }

      const isNativeAsset = isSymbolMatch(asset.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAsset.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.callTxMethod(await handleExecuteTransfer(this.node, input))
      }
    }

    if (destination === 'Polimec') {
      return this.transferToPolimec(input)
    }

    return this.transferToAssetHub(input)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (asset.symbol === this.getNativeAssetSymbol()) {
      return transferXTokens(input, Hydration.NATIVE_ASSET_ID)
    }

    assertHasId(asset)

    return transferXTokens(input, Number(asset.assetId))
  }

  protected canUseXTokens({
    to: destination,
    asset,
    feeAsset
  }: TSendInternalOptions<TApi, TRes>): boolean {
    const isEthAsset =
      asset.multiLocation &&
      findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)
    return (
      destination !== 'Ethereum' &&
      destination !== 'Polimec' &&
      !(destination === 'AssetHubPolkadot' && asset.symbol === 'DOT') &&
      !isEthAsset &&
      !feeAsset
    )
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Balances',
      method: 'transfer_keep_alive',
      parameters: {
        dest: address,
        value: asset.amount
      }
    })
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: address,
        currency_id: Number(asset.assetId),
        amount: asset.amount
      }
    })
  }
}

export default Hydration
