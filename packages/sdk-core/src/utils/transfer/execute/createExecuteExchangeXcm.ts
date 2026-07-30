import type { TSubstrateChain } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../../constants'
import type { TSerializedExtrinsics, TWeight } from '../../../types'
import { type TPolkadotXCMTransferOptions } from '../../../types'
import { createBeneficiaryLocation, createDestination, localizeLocation } from '../../location'
import { createExecutionProgram } from './createExecutionProgram'

export const createExecuteExchangeXcm = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain,
  weight: TWeight,
  originExecutionFee: bigint,
  destExecutionFee: bigint,
  isFeeEstimate = false
): TRes => {
  const { api, version, assetInfo: asset, destination, paraIdTo, recipient, sender } = input

  const dest = createDestination(api, version, origin, destination, paraIdTo)

  const beneficiary = createBeneficiaryLocation({
    api,
    address: recipient,
    version
  })

  const transformedLocation = localizeLocation(origin, asset.location)

  const originFeeAsset = {
    id: transformedLocation,
    fun: {
      Fungible: originExecutionFee
    }
  }

  const destinationFeeAsset = {
    id: asset.location,
    fun: {
      Fungible: destExecutionFee
    }
  }

  const destinationProgram = createExecutionProgram({
    version,
    feeAsset: destinationFeeAsset,
    executionFee: isFeeEstimate ? undefined : destExecutionFee,
    xcm: [
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
    ],
    refundBeneficiary: beneficiary
  })

  const originProgram = createExecutionProgram({
    version,
    feeAsset: originFeeAsset,
    executionFee: isFeeEstimate ? undefined : originExecutionFee,
    xcm: [
      {
        InitiateTeleport: {
          assets: { Wild: { AllCounted: 1 } },
          dest,
          xcm: destinationProgram
        }
      }
    ],
    refundBeneficiary: createBeneficiaryLocation({
      api,
      address: sender ?? recipient,
      version
    })
  })

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
          ...originProgram
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
