import { isSystemChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import { AmountTooLowError } from '../../errors'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { createAsset, normalizeAmount } from '../../utils'
import { createBeneficiaryLocation, localizeLocation } from '../../utils/location'

const resolveBuyExecutionAmount = <TApi, TRes>(
  { isRelayAsset, assetInfo }: TTypeAndThenCallContext<TApi, TRes>,
  isForFeeCalc: boolean,
  { hopFees, destFee }: TTypeAndThenFees,
  systemAssetAmount: bigint
) => {
  if (isForFeeCalc) {
    // Rough estimates for dummy XCM call, that is later dryRunned
    return isRelayAsset ? assetInfo.amount / 2n : systemAssetAmount / 2n
  }

  // We have actual fees, calculate exact buy execution amount
  return isRelayAsset ? assetInfo.amount - hopFees : destFee
}

export const createCustomXcm = <TApi, TRes>(
  context: TTypeAndThenCallContext<TApi, TRes>,
  assetCount: number,
  isForFeeCalc: boolean,
  systemAssetAmount: bigint,
  fees: TTypeAndThenFees = {
    hopFees: 0n,
    destFee: 0n
  }
) => {
  const { origin, dest, reserve, isSubBridge, isRelayAsset, assetInfo, options } = context
  const { destination, version, address, paraIdTo } = options
  const { hopFees, destFee } = fees

  const feeAssetLocation = !isRelayAsset ? RELAY_LOCATION : assetInfo.location

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

  if (!isRelayAsset)
    assetsFilter.push(
      createAsset(version, hopFees + destFee, localizeLocation(reserve.chain, RELAY_LOCATION))
    )

  assetsFilter.push(
    createAsset(version, assetInfo.amount, localizeLocation(reserve.chain, assetInfo.location))
  )

  if (isSubBridge || (origin.chain !== reserve.chain && dest.chain !== reserve.chain)) {
    const buyExecutionAmount = resolveBuyExecutionAmount(
      context,
      isForFeeCalc,
      fees,
      systemAssetAmount
    )

    if (buyExecutionAmount < 0n && !isForFeeCalc) throw new AmountTooLowError()

    const filter = isForFeeCalc
      ? {
          Wild: {
            AllCounted: assetCount
          }
        }
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
