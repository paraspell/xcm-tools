import type { TSubstrateChain } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../../constants'
import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TSerializedExtrinsics, TWeight } from '../../../types'
import { type TPolkadotXCMTransferOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { createBeneficiaryLocation, localizeLocation } from '../../location'

export const createExecuteExchangeXcm = <TApi, TRes>(
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  origin: TSubstrateChain,
  weight: TWeight,
  originExecutionFee: bigint,
  destExecutionFee: bigint
): TRes => {
  const { api, version, assetInfo: asset, destination, paraIdTo, address } = input

  const dest = createDestination(version, origin, destination, paraIdTo)

  const beneficiary = createBeneficiaryLocation({
    api,
    address: address,
    version
  })

  assertHasLocation(asset)

  const transformedLocation = localizeLocation(origin, asset.location)

  const call: TSerializedExtrinsics = {
    module: 'PolkadotXcm',
    method: 'execute',
    params: {
      message: {
        [version]: [
          {
            WithdrawAsset: [
              {
                id: transformedLocation,
                fun: {
                  Fungible: asset.amount
                }
              }
            ]
          },
          {
            BuyExecution: {
              fees: {
                id: transformedLocation,
                fun: {
                  Fungible: originExecutionFee
                }
              },
              weight_limit: 'Unlimited'
            }
          },
          {
            InitiateTeleport: {
              assets: { Wild: { AllCounted: 1 } },
              dest,
              xcm: [
                {
                  BuyExecution: {
                    fees: {
                      id: asset.location,
                      fun: {
                        Fungible: destExecutionFee
                      }
                    },
                    weight_limit: 'Unlimited'
                  }
                },
                {
                  ExchangeAsset: {
                    give: {
                      Wild: {
                        AllCounted: 1
                      }
                    },
                    want: [
                      {
                        id: DOT_LOCATION,
                        fun: { Fungible: 100000000n } // 0.01 DOT
                      }
                    ],
                    maximal: false
                  }
                },
                {
                  DepositAsset: {
                    assets: {
                      Wild: {
                        AllCounted: 2
                      }
                    },
                    beneficiary
                  }
                }
              ]
            }
          }
        ]
      },
      max_weight: {
        ref_time: weight.refTime,
        proof_size: weight.proofSize
      }
    }
  }

  return api.deserializeExtrinsics(call)
}
