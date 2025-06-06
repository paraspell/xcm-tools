// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'
import { hasJunction, Parents, type TMultiLocation, Version } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import { createMultiAsset } from '../../pallets/xcmPallet/utils'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { createBeneficiaryMultiLocation } from '../../utils'
import { getParaId } from '../config'
import ParachainNode from '../ParachainNode'
import { createTransferAssetsTransfer, createTypeAndThenTransfer } from './Polimec'

const createCustomXcmAh = <TApi, TRes>(
  { api, scenario, address }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: 1 } },
        beneficiary: createBeneficiaryMultiLocation({
          api,
          scenario,
          pallet: 'PolkadotXcm',
          recipientAddress: address,
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

  constructor() {
    super('Hydration', 'hydradx', 'polkadot', Version.V4)
  }

  transferToAssetHub<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): TRes {
    const { api, asset, scenario, version, destination } = input

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createVersionedDestination(
          scenario,
          version,
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

  transferToPolimec<TApi, TRes>(options: TPolkadotXCMTransferOptions<TApi, TRes>): TRes {
    const { api, asset, version = this.version } = options
    const symbol = asset.symbol.toUpperCase()

    if (symbol === 'DOT') {
      const call = createTypeAndThenTransfer(options, version)
      return api.callTxMethod(call)
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
    const { destination } = input
    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
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

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return transferXTokens(input, Number(asset.assetId))
  }

  protected canUseXTokens({ to: destination, asset }: TSendInternalOptions<TApi, TRes>): boolean {
    const isEthAsset =
      asset.multiLocation &&
      findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)
    return (
      destination !== 'Ethereum' &&
      destination !== 'Polimec' &&
      !(destination === 'AssetHubPolkadot' && asset.symbol === 'DOT') &&
      !isEthAsset
    )
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Balances',
      method: 'transfer_keep_alive',
      parameters: {
        dest: address,
        value: BigInt(asset.amount)
      }
    })
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (asset.assetId === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: address,
        currency_id: Number(asset.assetId),
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Hydration
