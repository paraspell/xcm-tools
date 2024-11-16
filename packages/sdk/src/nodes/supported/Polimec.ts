// Contains detailed structure of XCM call construction for Polimec Parachain

import type { IPolkadotApi } from '../../api'
import { createMultiAsset, createPolkadotXcmHeader } from '../../pallets/xcmPallet/utils'
import type {
  IPolkadotXCMTransfer,
  PolkadotXCMTransferInput,
  TAddress,
  TAsset,
  TCurrencySelectionHeaderArr,
  TDestination,
  TMultiLocation,
  TRelayToParaOptions,
  TScenario,
  TSerializedApiCallV2,
  TTransferReturn
} from '../../types'
import { Parents, Version } from '../../types'
import { generateAddressPayload, isForeignAsset } from '../../utils'
import ParachainNode from '../ParachainNode'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { DOT_MULTILOCATION } from '../../const'
import { getNodeProviders, getParaId } from '../config'

const GAS_LIMIT = BigInt('1000000000')

const createCustomXcmPolimec = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress,
  scenario: TScenario,
  destination: TDestination | undefined,
  paraIdTo: number | undefined,
  version: Version
) => {
  const paraId =
    destination !== undefined && typeof destination !== 'object' && destination !== 'Ethereum'
      ? (paraIdTo ?? getParaId(destination))
      : undefined
  return {
    [version]: [
      {
        DepositReserveAsset: {
          assets: {
            Wild: {
              AllCounted: 1
            }
          },
          dest: Object.values(
            createPolkadotXcmHeader(scenario, version, destination, paraId, undefined, Parents.ONE)
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
                    Fungible: BigInt(GAS_LIMIT)
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
                beneficiary: Object.values(
                  generateAddressPayload(api, scenario, 'PolkadotXcm', address, version, undefined)
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

  private getAssetMultiLocation = (asset: TAsset): TMultiLocation => {
    if (!isForeignAsset(asset) && asset.symbol === 'DOT') {
      return DOT_MULTILOCATION
    }

    if (isForeignAsset(asset) && asset.multiLocation !== undefined) {
      return asset.multiLocation as TMultiLocation
    }

    throw new InvalidCurrencyError(
      `Transfer of asset ${JSON.stringify(asset)} is not supported yet`
    )
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    const { api, version = this.version, destination, address, amount, scenario, paraIdTo } = input

    if (scenario === 'ParaToPara' && destination === 'AssetHubPolkadot') {
      const currencySelection: TCurrencySelectionHeaderArr = {
        [version]: [
          createMultiAsset(version, amount.toString(), this.getAssetMultiLocation(input.asset))
        ]
      }

      return Promise.resolve(
        PolkadotXCMTransferImpl.transferPolkadotXCM(
          {
            ...input,
            currencySelection
          },
          'transfer_assets',
          'Unlimited'
        )
      )
    }

    if (scenario !== 'ParaToRelay') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const versionOrDefault = version ?? Version.V3

    const call: TSerializedApiCallV2 = {
      module: 'PolkadotXcm',
      section: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createPolkadotXcmHeader(
          'RelayToPara',
          versionOrDefault,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: {
          [versionOrDefault]: [
            Object.values(this.createCurrencySpec(amount, 'RelayToPara', versionOrDefault))[0][0]
          ]
        },
        assets_transfer_type: 'Teleport',
        remote_fees_id: {
          [versionOrDefault]: {
            Concrete: {
              parents: Parents.ZERO,
              interior: 'Here'
            }
          }
        },
        fees_transfer_type: 'Teleport',
        custom_xcm_on_dest: createCustomXcmPolimec(
          api,
          address,
          scenario,
          destination,
          paraIdTo,
          versionOrDefault
        ),
        weight_limit: 'Unlimited'
      }
    }

    return Promise.resolve(api.callTxMethod(call))
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCallV2 {
    const { version = Version.V3, api, address, destination, amount, paraIdTo } = options

    const call: TSerializedApiCallV2 = {
      module: 'XcmPallet',
      section: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createPolkadotXcmHeader(
          'RelayToPara',
          version,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: {
          [version]: [
            Object.values(this.createCurrencySpec(amount.toString(), 'RelayToPara', version))[0][0]
          ]
        },
        assets_transfer_type: 'Teleport',
        remote_fees_id: {
          [version]: {
            Concrete: {
              parents: Parents.ZERO,
              interior: 'Here'
            }
          }
        },
        fees_transfer_type: 'Teleport',
        custom_xcm_on_dest: createCustomXcmPolimec(
          api,
          address,
          'RelayToPara',
          destination,
          paraIdTo,
          version
        ),
        weight_limit: 'Unlimited'
      }
    }

    return call
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[1]
  }
}

export default Polimec
