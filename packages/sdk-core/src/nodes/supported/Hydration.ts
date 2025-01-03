// Contains detailed structure of XCM call construction for Hydration Parachain

import { ethers } from 'ethers'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall
} from '../../types'
import { type IXTokensTransfer, Parents, Version, type TXTokensTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../../pallets/xTokens'
import { InvalidCurrencyError } from '../../errors'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { ETHEREUM_JUNCTION } from '../../constants'
import { generateAddressPayload } from '../../utils'
import type { IPolkadotApi } from '../../api'
import { createEthereumTokenLocation } from '../../utils/multiLocation/createEthereumTokenLocation'
import { isForeignAsset } from '../../utils/assets'
import { getParaId } from '../config'

const calculateFee = async <TApi, TRes>(api: IPolkadotApi<TApi, TRes>) => {
  const DEFAULT_FEE = 2_750_872_500_000n

  const ahApi = await api.createApiForNode('AssetHubPolkadot')

  const feeStorageItem = await ahApi.getFromStorage('0x5fbc5c7ba58845ad1f1a9a7c5bc12fad')
  const leFeeHex = feeStorageItem.replace('0x', '')
  const leFee = BigInt('0x' + leFeeHex.split('').reverse().join(''))

  const transfer_bridge_fee = leFee === 0n ? DEFAULT_FEE : BigInt(leFee.toString())

  const transfer_assethub_execution_fee = 2200000000n
  return (transfer_bridge_fee + transfer_assethub_execution_fee).toString() // ~6.248 DOT (10 decimals)
}

const createCustomXcmAh = <TApi, TRes>(
  { api, scenario, address }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: 1 } },
        beneficiary: Object.values(
          generateAddressPayload(api, scenario, 'PolkadotXcm', address, version, undefined)
        )[0]
      }
    }
  ]
})

const createCustomXcmOnDest = <TApi, TRes>(
  { api, address, asset, scenario, ahAddress }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => {
  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
  }

  return {
    [version]: [
      {
        SetAppendix: [
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              beneficiary: Object.values(
                generateAddressPayload(
                  api,
                  scenario,
                  'PolkadotXcm',
                  ahAddress ?? '',
                  version,
                  undefined
                )
              )[0]
            }
          }
        ]
      },
      {
        InitiateReserveWithdraw: {
          assets: {
            Wild: {
              AllOf: { id: createEthereumTokenLocation(asset.assetId ?? ''), fun: 'Fungible' }
            }
          },
          reserve: {
            parents: Parents.TWO,
            interior: { X1: [ETHEREUM_JUNCTION] }
          },
          xcm: [
            {
              BuyExecution: {
                fees: {
                  id: {
                    parents: Parents.ZERO,
                    interior: {
                      X1: [{ AccountKey20: { network: null, key: asset.assetId } }]
                    }
                  },
                  fun: { Fungible: 1n }
                },
                weight_limit: 'Unlimited'
              }
            },
            {
              DepositAsset: {
                assets: { Wild: { AllCounted: 1 } },
                beneficiary: {
                  parents: Parents.ZERO,
                  interior: {
                    X1: [
                      {
                        AccountKey20: {
                          network: null,
                          key: address
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}

class Hydration<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  private static NATIVE_ASSET_ID = 0

  constructor() {
    super('Hydration', 'hydradx', 'polkadot', Version.V3)
  }

  async transferToEthereum<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, address, asset, scenario, version, destination, ahAddress } = input
    if (!ethers.isAddress(address)) {
      throw new Error('Only Ethereum addresses are supported for Ethereum transfers')
    }

    if (asset.symbol?.toUpperCase() !== 'WETH') {
      throw new InvalidCurrencyError(
        `Currency ${asset.symbol} is not supported for Ethereum transfers from Hydration`
      )
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    if (ahAddress === undefined) {
      throw new Error('AssetHub address is required for Ethereum transfers')
    }

    const versionOrDefault = version ?? Version.V4

    const ethMultiAsset = Object.values(
      createCurrencySpec(
        asset.amount,
        versionOrDefault,
        Parents.TWO,
        createEthereumTokenLocation(asset.assetId ?? '')
      )
    )[0][0]

    const fee = await calculateFee(api)

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
          [versionOrDefault]: [
            Object.values(this.createCurrencySpec(fee, 'ParaToRelay', versionOrDefault))[0][0],
            ethMultiAsset
          ]
        },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: {
          [versionOrDefault]: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: createCustomXcmOnDest(input, versionOrDefault),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
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
          [versionOrDefault]: [
            Object.values(
              this.createCurrencySpec(asset.amount, 'ParaToRelay', versionOrDefault)
            )[0][0]
          ]
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

  // Handles WETH Ethereum transfers
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

  protected canUseXTokens({ destination, asset }: TSendInternalOptions<TApi, TRes>): boolean {
    return (
      destination !== 'Ethereum' && !(destination === 'AssetHubPolkadot' && asset.symbol === 'DOT')
    )
  }
}

export default Hydration
