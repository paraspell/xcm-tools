import { isChainEvm, normalizeLocation } from '@paraspell/assets'
import { deepEqual, getJunctionValue, isExternalChain, isTrustedChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { AmountTooLowError, MissingParameterError } from '../../errors'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { assertSender, createAsset, normalizeAmount } from '../../utils'
import { createBeneficiaryLocation, createDestination, localizeLocation } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'

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

const resolveSnowbridgeMessageId = <TApi, TRes, TSigner>({
  origin,
  isSnowbridge,
  assetInfo,
  options: { sender, recipient }
}: TTypeAndThenCallContext<TApi, TRes, TSigner>) => {
  if (!isSnowbridge) return Promise.resolve(null)
  assertSender(sender)
  return generateMessageId(
    origin.api,
    sender,
    getParaId(origin.chain),
    JSON.stringify(assetInfo.location),
    JSON.stringify(recipient),
    assetInfo.amount
  )
}

export const createCustomXcm = async <TApi, TRes, TSigner>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner>,
  assetCount: number,
  isForFeeCalc: boolean,
  systemAssetAmount: bigint,
  fees: TTypeAndThenFees = {
    hopFees: 0n,
    destFee: 0n
  }
) => {
  const { origin, dest, reserve, isSubBridge, isRelayAsset, assetInfo, bridgeHopChain, options } =
    context
  const { destination, version, recipient, paraIdTo, sender, ahAddress } = options

  const buildRefundInstruction = () => {
    if (!sender || isSubBridge) return null

    const resolveRefundAddress = () => {
      if (ahAddress) return ahAddress
      if (!isChainEvm(origin.chain)) return sender
      if (!isChainEvm(dest.chain)) return recipient
      throw new MissingParameterError('ahAddress')
    }

    return {
      SetAppendix: [
        {
          DepositAsset: {
            assets: { Wild: { AllCounted: assetCount } },
            beneficiary: createBeneficiaryLocation({
              api: origin.api,
              address: resolveRefundAddress(),
              version
            })
          }
        }
      ]
    }
  }
  const { hopFees, destFee } = fees

  const messageId = await resolveSnowbridgeMessageId(context)
  const setTopic = messageId ? [{ SetTopic: messageId }] : []

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
        address: recipient,
        version
      })
    }
  }

  const assetsFilter = []

  if (!isRelayAsset && !isExternalChain(dest.chain))
    assetsFilter.push(
      createAsset(version, hopFees + destFee, localizeLocation(reserve.chain, RELAY_LOCATION))
    )

  assetsFilter.push(
    createAsset(
      version,
      assetInfo.amount,
      normalizeLocation(localizeLocation(reserve.chain, assetInfo.location), version)
    )
  )

  const isAssetEthereumNative = deepEqual(
    getJunctionValue(assetInfo.location, 'GlobalConsensus'),
    getEthereumJunction(origin.chain, false).GlobalConsensus
  )

  if (
    isSubBridge ||
    bridgeHopChain ||
    (origin.chain !== reserve.chain && dest.chain !== reserve.chain)
  ) {
    const buyExecutionAmount = isExternalChain(dest.chain)
      ? 1n
      : resolveBuyExecutionAmount(context, isForFeeCalc, fees, systemAssetAmount)

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

    const buyExecutionAsset = isExternalChain(dest.chain)
      ? createAsset(version, buyExecutionAmount, assetLocLocalized)
      : createAsset(version, normalizeAmount(buyExecutionAmount), feeLocLocalized)

    const buyExecution = {
      BuyExecution: {
        fees: buyExecutionAsset,
        weight_limit: 'Unlimited'
      }
    }

    if (isSubBridge) {
      return [buyExecution, depositInstruction]
    }

    const destLoc = createDestination(version, origin.chain, destination, paraIdTo)

    // If both reserve (B) and destination (C) are trusted chains,
    // use teleport instead of DepositReserveAsset
    if (isTrustedChain(reserve.chain) && isTrustedChain(dest.chain)) {
      const refund = buildRefundInstruction()
      return [
        ...(refund ? [refund] : []),
        {
          InitiateTeleport: {
            assets: filter,
            dest: destLoc,
            xcm: [buyExecution, depositInstruction, ...setTopic]
          }
        },
        ...setTopic
      ]
    }

    if (isExternalChain(dest.chain) && (isAssetEthereumNative || origin.chain === 'Mythos')) {
      const buyExecutionAtReserve = {
        BuyExecution: {
          fees: buyExecutionAsset,
          weight_limit: 'Unlimited'
        }
      }

      const refund = buildRefundInstruction()
      return [
        ...(refund ? [refund] : []),
        {
          InitiateReserveWithdraw: {
            assets: {
              Wild: {
                AllOf: { id: assetInfo.location, fun: 'Fungible' }
              }
            },
            reserve: destLoc,
            xcm: [buyExecutionAtReserve, depositInstruction, ...setTopic]
          }
        },
        ...setTopic
      ]
    }

    const refund = buildRefundInstruction()
    return [
      ...(refund ? [refund] : []),
      {
        DepositReserveAsset: {
          assets: filter,
          dest: destLoc,
          xcm: [buyExecution, depositInstruction, ...setTopic]
        }
      },
      ...setTopic
    ]
  }

  return [depositInstruction, ...setTopic]
}
