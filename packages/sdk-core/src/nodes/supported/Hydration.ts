// Contains detailed structure of XCM call construction for Hydration Parachain

import type {
  IPolkadotXCMTransfer,
  TMultiLocation,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall
} from '../../types'
import { type IXTokensTransfer, Parents, Version, type TXTokensTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../../pallets/xTokens'
import { InvalidCurrencyError } from '../../errors'
import { generateAddressPayload } from '../../utils'
import { isForeignAsset } from '../../utils/assets'
import { getParaId } from '../config'
import { createMultiAsset } from '../../pallets/xcmPallet/utils'
import { DOT_MULTILOCATION } from '../../constants'

const createCustomXcmAh = <TApi, TRes>(
  { api, scenario, address }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: 1 } },
        beneficiary: (
          Object.values(
            generateAddressPayload(api, scenario, 'PolkadotXcm', address, version, undefined)
          ) as TMultiLocation[]
        )[0]
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

  // Handles transfers to Ethereum
  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { destination } = input
    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
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
    return (
      destination !== 'Ethereum' && !(destination === 'AssetHubPolkadot' && asset.symbol === 'DOT')
    )
  }
}

export default Hydration
