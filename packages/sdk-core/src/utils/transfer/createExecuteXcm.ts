import { InvalidCurrencyError, isAssetEqual, isForeignAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import { createDestination } from '../../pallets/xcmPallet/utils'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { addXcmVersionHeader } from '../addXcmVersionHeader'
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

  if (!isForeignAsset(asset) || !asset.multiLocation || !asset.assetId) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(asset)} is missing multiLocation or assetId`
    )
  }

  if (feeAsset && (!isForeignAsset(feeAsset) || !feeAsset.multiLocation || !feeAsset.assetId)) {
    throw new InvalidCurrencyError(
      `Fee asset ${JSON.stringify(feeAsset)} is missing multiLocation or assetId`
    )
  }

  const assetML = transformMultiLocation(asset.multiLocation)
  const feeML = transformMultiLocation(feeAsset?.multiLocation ?? asset.multiLocation)

  const sameFeeAsset = feeAsset && isAssetEqual(asset, feeAsset)

  const amountWithoutFee = BigInt(asset.amount) - executionFee

  const assetsToWithdraw = [
    {
      assetId: asset.assetId,
      multiasset: {
        id: assetML,
        fun: {
          Fungible: BigInt(asset.amount)
        }
      }
    }
  ]

  if (!sameFeeAsset && feeAsset?.multiLocation) {
    assetsToWithdraw.push({
      assetId: feeAsset.assetId as string,
      multiasset: {
        id: feeML,
        fun: {
          Fungible: executionFee
        }
      }
    })
  }

  assetsToWithdraw.sort((a, b) => (a.assetId > b.assetId ? 1 : -1))

  const xcm = [
    {
      WithdrawAsset: assetsToWithdraw.map(({ multiasset }) => multiasset)
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
            ref_time: 150n,
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
              id: assetML,
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
                id: asset.multiLocation,
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
