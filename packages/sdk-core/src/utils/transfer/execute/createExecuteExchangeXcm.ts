import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../../constants'
import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TSerializedApiCall, TWeight } from '../../../types'
import { type TPolkadotXCMTransferOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { createBeneficiaryLocation, localizeLocation } from '../../location'

export const createExecuteExchangeXcm = <TApi, TRes>(
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  origin: TNodeDotKsmWithRelayChains,
  weight: TWeight,
  originExecutionFee: bigint,
  destExecutionFee: bigint
): TRes => {
  const { api, version, asset, destination, paraIdTo, address } = input

  const dest = createDestination(version, origin, destination, paraIdTo)

  const beneficiary = createBeneficiaryLocation({
    api,
    address: address,
    version
  })

  assertHasLocation(asset)

  const transformedMultiLocation = localizeLocation(origin, asset.multiLocation)

  const call: TSerializedApiCall = {
    module: 'PolkadotXcm',
    method: 'execute',
    parameters: {
      message: {
        [version]: [
          {
            WithdrawAsset: [
              {
                id: transformedMultiLocation,
                fun: {
                  Fungible: BigInt(asset.amount)
                }
              }
            ]
          },
          {
            BuyExecution: {
              fees: {
                id: transformedMultiLocation,
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
                      id: asset.multiLocation,
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
                        id: DOT_MULTILOCATION,
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

  return api.callTxMethod(call)
}
