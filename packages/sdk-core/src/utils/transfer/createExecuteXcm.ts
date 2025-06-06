import { InvalidCurrencyError, isAssetEqual } from '@paraspell/assets'

import { addXcmVersionHeader, createDestination } from '../../pallets/xcmPallet/utils'
import type { Version } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { createBeneficiary } from '../createBeneficiary'
import { transformMultiLocation } from '../multiLocation'

export const createExecuteXcm = <TApi, TRes>(
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  executionFee: bigint,
  version: Version
) => {
  const { api, asset, scenario, destination, paraIdTo, address, feeAsset } = input

  const dest = createDestination(scenario, version, destination, paraIdTo)

  const beneficiary = createBeneficiary({
    api,
    scenario,
    pallet: 'PolkadotXcm',
    recipientAddress: address,
    version,
    paraId: paraIdTo
  })

  if (!asset.multiLocation || (feeAsset && !feeAsset.multiLocation)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
  }

  const assetML = asset.multiLocation
  const feeML = feeAsset?.multiLocation ?? asset.multiLocation

  const sameFeeAsset = feeAsset && isAssetEqual(asset, feeAsset)

  const amountWithoutFee = BigInt(asset.amount) - executionFee

  const xcm = [
    {
      WithdrawAsset: [
        {
          id: assetML,
          fun: {
            Fungible: BigInt(asset.amount)
          }
        },
        ...(!sameFeeAsset && feeAsset?.multiLocation
          ? [
              {
                id: feeAsset.multiLocation,
                fun: {
                  Fungible: executionFee
                }
              }
            ]
          : [])
      ]
    },
    {
      BuyExecution: {
        fees: {
          id: feeML,
          fun: {
            Fungible: executionFee
          }
        },
        weight_limit: {
          Limited: {
            ref_time: 450n,
            proof_size: 0n
          }
        }
      }
    },
    {
      DepositReserveAsset: {
        assets: {
          Definite: [
            {
              id: transformMultiLocation(assetML),
              fun: {
                Fungible: sameFeeAsset ? amountWithoutFee : BigInt(asset.amount)
              }
            }
          ]
        },
        dest,
        xcm: [
          {
            BuyExecution: {
              fees: {
                id: transformMultiLocation(asset.multiLocation),
                fun: {
                  Fungible: sameFeeAsset ? amountWithoutFee - executionFee : BigInt(asset.amount)
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
              beneficiary
            }
          }
        ]
      }
    }
  ]

  return addXcmVersionHeader(xcm, version)
}
