import {
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'

import { ETHEREUM_JUNCTION } from '../../constants'
import { type TPolkadotXCMTransferOptions, type Version } from '../../types'
import { createBeneficiaryMultiLocation } from '../multiLocation'

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

  const ethAsset = findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)

  if (!ethAsset) {
    throw new InvalidCurrencyError(
      `Could not obtain Ethereum asset address for ${JSON.stringify(asset)}`
    )
  }

  const interior_sb =
    ethAsset.symbol === 'ETH'
      ? { Here: null }
      : { X1: [{ AccountKey20: { network: null, key: ethAsset.assetId } }] }

  return {
    [version]: [
      {
        SetAppendix: [
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              beneficiary: createBeneficiaryMultiLocation({
                api,
                scenario,
                pallet: 'PolkadotXcm',
                recipientAddress: senderAddress,
                version
              })
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
                    interior: interior_sb
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
