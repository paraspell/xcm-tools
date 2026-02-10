import { isTrustedChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { AmountTooLowError } from '../../errors'
import { createPayFees } from '../../pallets/polkadotXcm'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { assertSenderAddress, createAsset, normalizeAmount } from '../../utils'
import { createBeneficiaryLocation, createDestination, localizeLocation } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import type { createRefundInstruction } from './utils'

const resolveBuyExecutionAmount = <TApi, TRes, TSigner>(
  { isRelayAsset, assetInfo }: TTypeAndThenCallContext<TApi, TRes, TSigner>,
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

export const createCustomXcm = async <TApi, TRes, TSigner>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner>,
  assetCount: number,
  isForFeeCalc: boolean,
  systemAssetAmount: bigint,
  refundInstruction: ReturnType<typeof createRefundInstruction> | null,
  fees: TTypeAndThenFees = {
    hopFees: 0n,
    destFee: 0n
  }
) => {
  const { origin, dest, reserve, isSubBridge, isSnowbridge, isRelayAsset, assetInfo, options } =
    context
  const { destination, version, address, senderAddress, paraIdTo } = options
  const { hopFees, destFee } = fees

  const feeAssetLocation = !isRelayAsset ? RELAY_LOCATION : assetInfo.location

  const feeLocLocalized = localizeLocation(dest.chain, feeAssetLocation, origin.chain)

  const assetLocLocalized = localizeLocation(dest.chain, assetInfo.location, origin.chain)

  const asset = createAsset(version, assetInfo.amount, assetLocLocalized)

  const allOfSelector = {
    AllOf: {
      id: asset.id,
      fun: 'Fungible'
    }
  }

  const depositInstruction = {
    DepositAsset: {
      assets: {
        Wild:
          assetCount > 1
            ? allOfSelector
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

    const feeInstruction = createPayFees(
      version,
      createAsset(version, normalizeAmount(buyExecutionAmount), feeLocLocalized)
    )

    if (isSubBridge) {
      return [...feeInstruction, depositInstruction]
    }

    const destLoc = createDestination(version, origin.chain, destination, paraIdTo)

    // If both reserve (B) and destination (C) are trusted chains,
    // use teleport instead of DepositReserveAsset
    if (isTrustedChain(reserve.chain) && isTrustedChain(dest.chain)) {
      return [
        ...(refundInstruction ? [refundInstruction] : []),
        {
          InitiateTeleport: {
            assets: filter,
            dest: destLoc,
            xcm: [...feeInstruction, depositInstruction]
          }
        }
      ]
    }

    return [
      ...(refundInstruction ? [refundInstruction] : []),
      {
        DepositReserveAsset: {
          assets: filter,
          dest: destLoc,
          xcm: [...feeInstruction, depositInstruction]
        }
      }
    ]
  }

  if (isSnowbridge) {
    assertSenderAddress(senderAddress)
    const messageId = await generateMessageId(
      origin.api,
      senderAddress,
      getParaId(origin.chain),
      JSON.stringify(assetInfo.location),
      JSON.stringify(address),
      assetInfo.amount
    )
    return [
      depositInstruction,
      {
        SetTopic: messageId
      }
    ]
  }

  return [depositInstruction]
}
