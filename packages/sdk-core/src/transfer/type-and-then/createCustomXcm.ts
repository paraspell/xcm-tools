import { extractAssetLocation, isChainEvmImpl, normalizeLocation } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue, isExternalChain, isTrustedChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { AmountTooLowError, MissingParameterError } from '../../errors'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { assertSender, createAsset, isNativeAssetTeleport, normalizeAmount } from '../../utils'
import { createBeneficiaryLocation, createDestination, localizeLocationImpl } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'

const resolveBuyExecutionAmount = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  { isRelayAsset, assetInfo }: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>,
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

const resolveSnowbridgeMessageId = <TApi, TRes, TSigner, TCustomChain extends string = never>({
  origin,
  isSnowbridge,
  assetInfo,
  options: { sender, recipient }
}: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>) => {
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

export const createCustomXcm = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>,
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
  const { destination, version, recipient, paraIdTo, sender, ahAddress, overriddenAsset } = options

  const overriddenAssets = Array.isArray(overriddenAsset) ? overriddenAsset : null

  const buildRefundInstruction = () => {
    if (!sender || isSubBridge) return null

    const resolveRefundAddress = () => {
      if (ahAddress) return ahAddress
      if (!isChainEvmImpl(origin.chain, origin.api._customCtx)) return sender
      if (!isChainEvmImpl(dest.chain, dest.api._customCtx)) return recipient
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

  const feeLocLocalized = localizeLocationImpl(
    origin.api,
    dest.chain,
    feeAssetLocation,
    origin.chain
  )

  const assetLocLocalized = localizeLocationImpl(
    origin.api,
    dest.chain,
    assetInfo.location,
    origin.chain
  )

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
          assetCount > 1 && !overriddenAssets
            ? allOfSelector
            : {
                AllCounted: assetCount
              }
      },
      beneficiary: createBeneficiaryLocation({
        api: isSubBridge ? dest.api : origin.api,
        address: recipient,
        version
      })
    }
  }

  const localizeFilterAsset = (amount: bigint, location: TLocation) =>
    createAsset(
      version,
      amount,
      normalizeLocation(localizeLocationImpl(origin.api, reserve.chain, location), version)
    )

  const assetsFilter = []

  if (overriddenAssets) {
    assetsFilter.push(
      ...overriddenAssets.map(asset =>
        localizeFilterAsset(asset.fun.Fungible, extractAssetLocation(asset))
      )
    )
  } else {
    if (!isRelayAsset && !isExternalChain(dest.chain))
      assetsFilter.push(
        createAsset(
          version,
          hopFees + destFee,
          localizeLocationImpl(origin.api, reserve.chain, RELAY_LOCATION)
        )
      )

    assetsFilter.push(localizeFilterAsset(assetInfo.amount, assetInfo.location))
  }

  const isAssetEthereumNative = deepEqual(
    getJunctionValue(assetInfo.location, 'GlobalConsensus'),
    getEthereumJunction(origin.api, origin.chain, false).GlobalConsensus
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

    const destLoc = createDestination(origin.api, version, origin.chain, destination, paraIdTo)

    // If both reserve (B) and destination (C) are trusted chains,
    // use teleport instead of DepositReserveAsset
    if (
      (isTrustedChain(reserve.chain) && isTrustedChain(dest.chain)) ||
      isNativeAssetTeleport(origin.api, reserve.chain, dest.chain, assetInfo)
    ) {
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
