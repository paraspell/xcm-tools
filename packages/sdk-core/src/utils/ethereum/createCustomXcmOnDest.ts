import {
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  isNodeEvm
} from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'

import { ETHEREUM_JUNCTION } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation } from '../assertions'
import { createBeneficiaryLocation } from '../location'

export const createCustomXcmOnDest = <TApi, TRes>(
  {
    api,
    address,
    asset,
    senderAddress,
    ahAddress,
    version
  }: TPolkadotXCMTransferOptions<TApi, TRes>,
  origin: TNodeWithRelayChains,
  messageId: string
) => {
  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
  }

  assertHasLocation(asset)

  if (!senderAddress) {
    throw new InvalidParameterError(`Please provide senderAddress`)
  }

  if (isNodeEvm(origin) && !ahAddress) {
    throw new InvalidParameterError(`Please provide ahAddress`)
  }

  const ethAsset = findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)

  if (!ethAsset) {
    throw new InvalidCurrencyError(
      `Could not obtain Ethereum asset address for ${JSON.stringify(asset)}`
    )
  }

  const interiorSb =
    ethAsset.symbol === 'ETH'
      ? { Here: null }
      : { X1: [{ AccountKey20: { network: null, key: ethAsset.assetId } }] }

  return {
    [version]: [
      {
        SetAppendix:
          origin === 'Mythos'
            ? []
            : [
                {
                  DepositAsset: {
                    assets: { Wild: 'All' },
                    beneficiary: createBeneficiaryLocation({
                      api,
                      address: isNodeEvm(origin) ? (ahAddress as string) : senderAddress,
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
                    interior: interiorSb
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
