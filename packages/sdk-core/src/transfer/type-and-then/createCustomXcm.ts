import { isSystemChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import { AmountTooLowError } from '../../errors'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import {
  createAsset,
  createBeneficiaryLocation,
  localizeLocation,
  normalizeAmount
} from '../../utils'

export const createCustomXcm = <TApi, TRes>(
  { origin, dest, reserve, isSubBridge, assetInfo, options }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  assetCount: number,
  isForFeeCalc: boolean,
  fees: TTypeAndThenFees = {
    reserveFee: 0n,
    refundFee: 0n,
    destFee: 0n
  }
) => {
  const { destination, version, address, paraIdTo } = options
  const { reserveFee, refundFee, destFee } = fees

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const feeLocLocalized = localizeLocation(dest.chain, feeAssetLocation, origin.chain)

  const asset = createAsset(
    version,
    assetInfo.amount,
    localizeLocation(dest.chain, assetInfo.location, origin.chain)
  )

  const depositInstruction = {
    DepositAsset: {
      assets: {
        Wild:
          assetCount > 1
            ? {
                AllOf: {
                  id: asset.id,
                  fun: 'Fungible'
                }
              }
            : {
                AllCounted: 1
              }
      },
      beneficiary: createBeneficiaryLocation({
        api: isSubBridge ? dest.api : origin.api,
        address,
        version
      })
    }
  }

  const assetsFilter = []

  if (!isDotAsset)
    assetsFilter.push(
      createAsset(version, reserveFee + destFee, localizeLocation(reserve.chain, RELAY_LOCATION))
    )

  assetsFilter.push(
    createAsset(version, assetInfo.amount, localizeLocation(reserve.chain, assetInfo.location))
  )

  if (isSubBridge || (origin.chain !== reserve.chain && dest.chain !== reserve.chain)) {
    const buyExecutionAmount = !isDotAsset ? destFee : assetInfo.amount - reserveFee - refundFee

    if (buyExecutionAmount < 0n && !isForFeeCalc) throw new AmountTooLowError()

    const filter = isForFeeCalc
      ? { Wild: 'All' }
      : {
          Definite: assetsFilter
        }

    const buyExecution = {
      BuyExecution: {
        fees: createAsset(version, normalizeAmount(buyExecutionAmount), feeLocLocalized),
        weight_limit: 'Unlimited'
      }
    }

    if (isSubBridge) {
      return [buyExecution, depositInstruction]
    }

    const destLoc = createDestination(version, origin.chain, destination, paraIdTo)

    // If destination is a system chain, use teleport instead of reserve deposit
    if (isSystemChain(dest.chain)) {
      return [
        {
          InitiateTeleport: {
            assets: filter,
            dest: destLoc,
            xcm: [buyExecution, depositInstruction]
          }
        }
      ]
    }

    return [
      {
        DepositReserveAsset: {
          assets: filter,
          dest: destLoc,
          xcm: [buyExecution, depositInstruction]
        }
      }
    ]
  }

  return [depositInstruction]
}
