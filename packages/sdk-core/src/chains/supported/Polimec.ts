// Contains detailed structure of XCM call construction for Polimec Parachain

import {
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isForeignAsset,
  type TAssetInfo
} from '@paraspell/assets'
import { isTLocation, Parents, replaceBigInt, type TLocation, Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type {
  IPolkadotXCMTransfer,
  TAddress,
  TDestination,
  TPolkadotXCMTransferOptions,
  TRelayToParaOptions,
  TScenario,
  TSerializedApiCall,
  TTransferLocalOptions
} from '../../types'
import {
  assertHasLocation,
  assertIsForeign,
  createBeneficiaryLocation,
  createX1Payload
} from '../../utils'
import { createAsset } from '../../utils/asset'
import { resolveParaId } from '../../utils/resolveParaId'
import { getParaId } from '../config'
import Parachain from '../Parachain'

const GAS_LIMIT = 1000000000n

const getAssetLocation = (asset: TAssetInfo): TLocation => {
  if (!isForeignAsset(asset) && asset.symbol === getNativeAssetSymbol('Polimec')) {
    return {
      parents: Parents.ZERO,
      interior: 'Here'
    }
  }

  if (isForeignAsset(asset) && asset.location !== undefined) {
    return asset.location
  }

  throw new InvalidCurrencyError(
    `Transfer of asset ${JSON.stringify(asset, replaceBigInt)} is not supported yet`
  )
}

export const createTransferAssetsTransfer = <TRes>(
  options: TPolkadotXCMTransferOptions<unknown, TRes>,
  version: Version
): Promise<TRes> => {
  const { assetInfo: asset } = options

  const location = getAssetLocation(asset)

  return transferPolkadotXcm(
    {
      ...options,
      asset: createAsset(version, asset.amount, location)
    },
    'transfer_assets',
    'Unlimited'
  )
}

const createTypeAndThenDest = (
  destination: TDestination,
  scenario: TScenario,
  version: Version
): TLocation =>
  isTLocation(destination)
    ? destination
    : {
        parents: scenario === 'ParaToPara' ? Parents.ONE : Parents.ZERO,
        interior: createX1Payload(version, {
          Parachain: getParaId('AssetHubPolkadot')
        })
      }

export const createTypeAndThenTransfer = <TApi, TRes>(
  {
    api,
    assetInfo: asset,
    address,
    scenario,
    destination,
    paraIdTo
  }: Pick<
    TPolkadotXCMTransferOptions<TApi, TRes>,
    'api' | 'assetInfo' | 'address' | 'scenario' | 'destination' | 'paraIdTo'
  >,
  version: Version,
  transferType: 'DestinationReserve' | 'Teleport' = 'DestinationReserve'
): TSerializedApiCall => ({
  module: scenario === 'RelayToPara' ? 'XcmPallet' : 'PolkadotXcm',
  method: 'transfer_assets_using_type_and_then',
  parameters: {
    dest: {
      [version]: createTypeAndThenDest(destination, scenario, version)
    },
    assets: {
      [version]: [
        createAsset(version, asset.amount, {
          parents: scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE,
          interior: 'Here'
        })
      ]
    },
    assets_transfer_type: transferType,
    remote_fees_id: {
      [version]: {
        parents: scenario === 'ParaToPara' ? Parents.ONE : Parents.ZERO,
        interior: 'Here'
      }
    },
    fees_transfer_type: transferType,
    custom_xcm_on_dest: createCustomXcmPolimec(api, address, destination, paraIdTo, version),
    weight_limit: 'Unlimited'
  }
})

const createCustomXcmPolimec = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress,
  destination: TDestination,
  paraIdTo: number | undefined,
  version: Version
) => {
  const paraId = resolveParaId(paraIdTo, destination)
  return {
    [version]: [
      {
        DepositReserveAsset: {
          assets: {
            Wild: {
              AllCounted: 1
            }
          },
          dest: createDestination(version, 'Polimec', destination, paraId, undefined, Parents.ONE),
          xcm: [
            {
              BuyExecution: {
                fees: {
                  id: {
                    parents: Parents.ONE,
                    interior: 'Here'
                  },
                  fun: {
                    Fungible: GAS_LIMIT
                  }
                },
                weight_limit: 'Unlimited'
              }
            },
            {
              DepositAsset: {
                assets: {
                  Wild: {
                    AllCounted: 1
                  }
                },
                beneficiary: createBeneficiaryLocation({
                  api,
                  address: address,
                  version
                })
              }
            }
          ]
        }
      }
    ]
  }
}

class Polimec<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Polimec', 'polimec', 'Polkadot', Version.V5)
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, version, assetInfo, destination, scenario } = input

    if (scenario === 'ParaToPara' && destination === 'Hydration' && assetInfo.symbol === 'DOT') {
      const call = createTypeAndThenTransfer(input, version)
      return api.callTxMethod(call)
    }

    if (
      scenario === 'ParaToPara' &&
      (destination === 'AssetHubPolkadot' || destination === 'Hydration')
    ) {
      return createTransferAssetsTransfer(input, version)
    }

    if (scenario !== 'ParaToRelay') {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    const call = createTypeAndThenTransfer(input, version, 'Teleport')
    return api.callTxMethod(call)
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): Promise<TSerializedApiCall> {
    const { version } = options

    const call = createTypeAndThenTransfer(
      {
        ...options,
        scenario: 'RelayToPara'
      },
      version,
      'Teleport'
    )

    return Promise.resolve(call)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    assertIsForeign(asset)
    assertHasLocation(asset)

    return api.callTxMethod({
      module: 'ForeignAssets',
      method: 'transfer',
      parameters: {
        id: asset.location,
        target: { Id: address },
        amount: asset.amount
      }
    })
  }
}

export default Polimec
