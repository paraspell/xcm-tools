// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'
import { hasJunction, Parents, type TMultiLocation } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import { createMultiAsset } from '../../pallets/xcmPallet/utils'
import XTokensTransferImpl from '../../pallets/xTokens'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
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
    super('Hydration', 'hydradx', 'polkadot', Version.V3)
  }

  transferToAssetHub<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): TRes {
    const { api, asset, scenario, version, destination } = input

    const versionOrDefault = version ?? Version.V3

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      section: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createPolkadotXcmHeader(
          scenario,
          versionOrDefault,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: {
          [versionOrDefault]: [createMultiAsset(versionOrDefault, asset.amount, DOT_MULTILOCATION)]
        },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: {
          [versionOrDefault]: {
            Concrete: {
              parents: Parents.ONE,
              interior: 'Here'
            }
          }
        },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: createCustomXcmAh(input, versionOrDefault),
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
      return XTokensTransferImpl.transferXTokens(input, Hydration.NATIVE_ASSET_ID)
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, Number(asset.assetId))
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
}

export default Hydration
