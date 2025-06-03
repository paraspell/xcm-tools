import { DOT_MULTILOCATION } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TSerializedApiCall, TWeight } from '../../types'
import { type TPolkadotXCMTransferOptions, Version } from '../../types'
import { createBeneficiary } from '../createBeneficiary'
import { transformMultiLocation } from '../multiLocation'

export const createExecuteExchangeXcm = <TApi, TRes>(
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  weight: TWeight,
  originExecutionFee: bigint,
  destExecutionFee: bigint
): TRes => {
  const { api, version = Version.V4, asset, scenario, destination, paraIdTo, address } = input

  const dest = createDestination(scenario, version, destination, paraIdTo)

  const beneficiary = createBeneficiary({
    api,
    scenario,
    pallet: 'PolkadotXcm',
    recipientAddress: address,
    version,
    paraId: paraIdTo
  })

  if (!asset.multiLocation) {
    throw new InvalidParameterError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
  }

  const transformedMultiLocation = transformMultiLocation(asset.multiLocation)

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
