import { isSystemChain } from '@paraspell/sdk-common'

import { MIN_FEE, RELAY_LOCATION } from '../../constants'
import { AmountTooLowError } from '../../errors'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { createAsset, createBeneficiaryLocation, localizeLocation } from '../../utils'

export const createCustomXcm = <TApi, TRes>(
  { origin, dest, reserve, assetInfo, options }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  fees: TTypeAndThenFees = {
    reserveFee: MIN_FEE,
    refundFee: 0n,
    destFee: MIN_FEE
  }
) => {
  const { destination, version, address, paraIdTo } = options
  const { reserveFee, refundFee, destFee } = fees

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const feeLocLocalized = localizeLocation(dest.chain, feeAssetLocation)

  const asset = createAsset(
    version,
    assetInfo.amount,
    localizeLocation(dest.chain, assetInfo.location)
  )

  const depositInstruction = {
    DepositAsset: {
      assets: {
        Wild: {
          AllOf: {
            id: asset.id,
            fun: 'Fungible'
          }
        }
      },
      beneficiary: createBeneficiaryLocation({
        api: origin.api,
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

  if (origin.chain !== reserve.chain && dest.chain !== reserve.chain) {
    const buyExecutionAmount = !isDotAsset ? destFee : assetInfo.amount - reserveFee - refundFee

    if (buyExecutionAmount < 0n) throw new AmountTooLowError()

    const filter =
      fees.destFee === MIN_FEE
        ? { Wild: 'All' }
        : {
            Definite: assetsFilter
          }

    const buyExecution = {
      BuyExecution: {
        fees: createAsset(version, buyExecutionAmount, feeLocLocalized),
        weight_limit: 'Unlimited'
      }
    }

    const destLoc = createDestination(version, origin.chain, destination, paraIdTo)

    // If destination is a system chain, use teleport instead of reserve deposit
    if (isSystemChain(dest.chain)) {
      return {
        InitiateTeleport: {
          assets: filter,
          dest: destLoc,
          xcm: [buyExecution, depositInstruction]
        }
      }
    }

    return {
      DepositReserveAsset: {
        assets: filter,
        dest: destLoc,
        xcm: [buyExecution, depositInstruction]
      }
    }
  }

  return depositInstruction
}
