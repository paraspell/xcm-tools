// Contains detailed structure of XCM call construction for Polimec Parachain

import type { TMultiAsset } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset, type TAsset } from '@paraspell/assets'
import { isTMultiLocation, Parents, type TMultiLocation } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import {
  addXcmVersionHeader,
  createMultiAsset,
  createPolkadotXcmHeader
} from '../../pallets/xcmPallet/utils'
import type {
  IPolkadotXCMTransfer,
  TAddress,
  TDestination,
  TPolkadotXCMTransferOptions,
  TRelayToParaOptions,
  TScenario,
  TSerializedApiCall,
  TXcmVersioned
} from '../../types'
import { Version } from '../../types'
import { createX1Payload, generateAddressPayload } from '../../utils'
import { resolveParaId } from '../../utils/resolveParaId'
import { getParaId } from '../config'
import ParachainNode from '../ParachainNode'

const GAS_LIMIT = 1000000000n

const getAssetMultiLocation = (asset: TAsset): TMultiLocation => {
  if (isForeignAsset(asset) && asset.multiLocation !== undefined) {
    return asset.multiLocation as TMultiLocation
  }

  throw new InvalidCurrencyError(`Transfer of asset ${JSON.stringify(asset)} is not supported yet`)
}

export const createTransferAssetsTransfer = <TRes>(
  options: TPolkadotXCMTransferOptions<unknown, TRes>,
  version: Version
): TRes => {
  const { asset } = options

  const currencySelection: TXcmVersioned<TMultiAsset[]> = addXcmVersionHeader(
    [createMultiAsset(version, asset.amount, getAssetMultiLocation(asset))],
    version
  )

  return PolkadotXCMTransferImpl.transferPolkadotXCM(
    {
      ...options,
      currencySelection
    },
    'transfer_assets',
    'Unlimited'
  )
}

const createTypeAndThenDest = (
  destination: TDestination,
  scenario: TScenario,
  version: Version
): TMultiLocation =>
  isTMultiLocation(destination)
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
    asset,
    address,
    scenario,
    destination,
    paraIdTo
  }: Pick<
    TPolkadotXCMTransferOptions<TApi, TRes>,
    'api' | 'asset' | 'address' | 'scenario' | 'destination' | 'paraIdTo'
  >,
  version: Version,
  transferType: 'DestinationReserve' | 'Teleport' = 'DestinationReserve'
): TSerializedApiCall => ({
  module: scenario === 'RelayToPara' ? 'XcmPallet' : 'PolkadotXcm',
  section: 'transfer_assets_using_type_and_then',
  parameters: {
    dest: {
      [version]: createTypeAndThenDest(destination, scenario, version)
    },
    assets: {
      [version]: [
        createMultiAsset(version, asset.amount, {
          parents: scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE,
          interior: 'Here'
        })
      ]
    },
    assets_transfer_type: transferType,
    remote_fees_id: {
      [version]: {
        Concrete: {
          parents: scenario === 'ParaToPara' ? Parents.ONE : Parents.ZERO,
          interior: 'Here'
        }
      }
    },
    fees_transfer_type: transferType,
    custom_xcm_on_dest: createCustomXcmPolimec(
      api,
      address,
      scenario,
      destination,
      paraIdTo,
      version
    ),
    weight_limit: 'Unlimited'
  }
})

const createCustomXcmPolimec = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress,
  scenario: TScenario,
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
          dest: (
            Object.values(
              createPolkadotXcmHeader(
                scenario,
                version,
                destination,
                paraId,
                undefined,
                Parents.ONE
              )
            ) as TMultiLocation[]
          )[0],
          xcm: [
            {
              BuyExecution: {
                fees: {
                  id: {
                    Concrete: {
                      parents: Parents.ONE,
                      interior: 'Here'
                    }
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
                beneficiary: (
                  Object.values(
                    generateAddressPayload(
                      api,
                      scenario,
                      'PolkadotXcm',
                      address,
                      version,
                      undefined
                    )
                  ) as TMultiLocation[]
                )[0]
              }
            }
          ]
        }
      }
    ]
  }
}

class Polimec<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Polimec', 'polimec', 'polkadot', Version.V3)
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, version = this.version, asset, destination, scenario } = input

    if (scenario === 'ParaToPara' && destination === 'Hydration' && asset.symbol === 'DOT') {
      const call = createTypeAndThenTransfer(input, version)
      return Promise.resolve(api.callTxMethod(call))
    }

    if (
      scenario === 'ParaToPara' &&
      (destination === 'AssetHubPolkadot' || destination === 'Hydration')
    ) {
      return createTransferAssetsTransfer(input, version)
    }

    if (scenario !== 'ParaToRelay') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const call = createTypeAndThenTransfer(input, version, 'Teleport')
    return Promise.resolve(api.callTxMethod(call))
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version = this.version } = options

    const call = createTypeAndThenTransfer(
      {
        ...options,
        scenario: 'RelayToPara'
      },
      version,
      'Teleport'
    )

    return call
  }
}

export default Polimec
