import {
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'
import { Parents, type TMultiLocation } from '@paraspell/sdk-common'

import { ETHEREUM_JUNCTION } from '../../constants'
import { type TPolkadotXCMTransferOptions, type Version } from '../../types'
import { generateAddressPayload } from '../generateAddressPayload'

export const createCustomXcmOnDest = <TApi, TRes>(
  { api, address, asset, scenario, senderAddress }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version,
  messageId: string
) => {
  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
  }

  if (!asset.multiLocation) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
  }

  if (!senderAddress) {
    throw new InvalidCurrencyError(`Please provide senderAddress`)
  }

  const ethAsset = findAssetByMultiLocation(
    getOtherAssets('Ethereum'),
    asset.multiLocation as TMultiLocation
  )

  if (!ethAsset) {
    throw new InvalidCurrencyError(
      `Could not obtain Ethereum asset address for ${JSON.stringify(asset)}`
    )
  }

  return {
    [version]: [
      {
        SetAppendix: [
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              beneficiary: (
                Object.values(
                  generateAddressPayload(
                    api,
                    scenario,
                    'PolkadotXcm',
                    senderAddress,
                    version,
                    undefined
                  )
                ) as TMultiLocation[]
              )[0]
            }
          }
        ]
      },
      {
        InitiateReserveWithdraw: {
          assets: {
            Wild: {
              AllOf: { id: asset.multiLocation, fun: 'Fungible' }
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
                      X1: [{ AccountKey20: { network: null, key: ethAsset.assetId } }]
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
            },
            {
              SetTopic: messageId
            }
          ]
        }
      },
      {
        SetTopic: messageId
      }
    ]
  }
}
