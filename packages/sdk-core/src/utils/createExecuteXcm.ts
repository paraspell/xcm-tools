import { InvalidParameterError } from '../errors'
import { createVersionedDestination, extractVersionFromHeader } from '../pallets/xcmPallet/utils'
import type { TSerializedApiCall, TWeight } from '../types'
import { type TPolkadotXCMTransferOptions, Version } from '../types'
import { createVersionedBeneficiary } from './createVersionedBeneficiary'
import { transformMultiLocation } from './multiLocation'

export const createExecuteXcm = <TApi, TRes>(
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  weight: TWeight,
  executionFee: bigint
): TRes => {
  const { api, version = Version.V4, asset, scenario, destination, paraIdTo, address } = input

  const destWithHeader = createVersionedDestination(scenario, version, destination, paraIdTo)
  const [_, dest] = extractVersionFromHeader(destWithHeader)

  const beneficiaryWithHeader = createVersionedBeneficiary({
    api,
    scenario,
    pallet: 'PolkadotXcm',
    recipientAddress: address,
    version,
    paraId: paraIdTo
  })
  const [__, beneficiary] = extractVersionFromHeader(beneficiaryWithHeader)

  if (!asset.multiLocation) {
    throw new InvalidParameterError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
  }

  const transformedMultiLocation = transformMultiLocation(asset.multiLocation)

  const amountWithoutFee = BigInt(asset.amount) - executionFee

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
                  Fungible: asset.amount
                }
              }
            ]
          },
          {
            BuyExecution: {
              fees: {
                id: transformedMultiLocation,
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
                    id: transformedMultiLocation,
                    fun: {
                      Fungible: amountWithoutFee
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
                        Fungible: amountWithoutFee - executionFee
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
      },
      max_weight: {
        ref_time: weight.refTime,
        proof_size: weight.proofSize
      }
    }
  }

  return api.callTxMethod(call)
}
