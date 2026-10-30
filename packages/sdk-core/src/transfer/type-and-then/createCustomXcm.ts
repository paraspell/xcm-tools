import { extractAssetLocation, normalizeLocation } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isExternalChain,
  isTrustedChain,
  replaceBigInt
} from '@paraspell/sdk-common'
import { stringToHex } from 'viem'

import { AmountTooLowError, MissingParameterError } from '../../errors'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import {
  assertSender,
  createAsset,
  createAssetId,
  isNativeAssetTeleport,
  normalizeAmount,
  sortAssets
} from '../../utils'
import { createBeneficiaryLocation, createDestination } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'
import { createEdExchangeInstructions } from '../../utils/transfer/createEdExchangeInstructions'
import { getFeeAssetLocation } from './createContext'

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
    origin.api.getParaId(origin.chain),
    stringToHex(JSON.stringify(assetInfo.location, replaceBigInt)),
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
  const {
    origin,
    dest,
    reserve,
    isSubBridge,
    isRelayAsset,
    assetInfo,
    bridgeHopChain,
    edDeposit,
    options
  } = context
  const { destination, version, recipient, paraIdTo, sender, ahAddress, overriddenAsset } = options

  const buildRefundInstruction = () => {
    if (!sender || isSubBridge) return null

    const resolveRefundAddress = () => {
      if (ahAddress) return ahAddress
      if (!origin.api.isChainEvm(origin.chain)) return sender
      if (!dest.api.isChainEvm(dest.chain)) return recipient
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

  const feeAssetLocation = getFeeAssetLocation(context)

  const feeLocLocalized = origin.api.localizeLocation(dest.chain, feeAssetLocation, origin.chain)

  const assetLocLocalized = origin.api.localizeLocation(
    dest.chain,
    assetInfo.location,
    origin.chain
  )

  const transferredAsset = overriddenAsset?.find(asset => !asset.isFeeAsset)

  const depositLocLocalized = transferredAsset
    ? origin.api.localizeLocation(dest.chain, extractAssetLocation(transferredAsset), origin.chain)
    : assetLocLocalized

  const createAllOf = (location: TLocation) => ({
    Wild: { AllOf: { id: createAssetId(version, location), fun: 'Fungible' } }
  })

  const isFeeLeftoverAboveEd = () => {
    const destFeeAsset = origin.api.findAssetInfoOnDest(
      origin.chain,
      dest.chain,
      { location: assetInfo.location },
      assetInfo
    )
    return (
      destFeeAsset !== null &&
      assetInfo.amount - hopFees - destFee >= BigInt(destFeeAsset.existentialDeposit)
    )
  }

  const isFeeTransferred = deepEqual(feeLocLocalized, depositLocLocalized)

  const resolveDepositAssets = () => {
    if (edDeposit !== undefined) {
      return { Wild: { AllCounted: isFeeTransferred ? assetCount + 1 : assetCount } }
    }

    const depositsFeeAsset =
      overriddenAsset !== undefined &&
      (isForFeeCalc || isExternalChain(dest.chain) || isFeeLeftoverAboveEd())

    return assetCount > 1 && !depositsFeeAsset
      ? createAllOf(depositLocLocalized)
      : { Wild: { AllCounted: assetCount } }
  }

  const depositInstruction = {
    DepositAsset: {
      assets: resolveDepositAssets(),
      beneficiary: createBeneficiaryLocation({
        api: isSubBridge ? dest.api : origin.api,
        address: recipient,
        version
      })
    }
  }

  const depositInstructions = [
    ...(edDeposit === undefined
      ? []
      : createEdExchangeInstructions(
          origin.api,
          dest.chain,
          version,
          feeLocLocalized,
          isFeeTransferred
        )),
    depositInstruction
  ]

  const localizeFilterAsset = (amount: bigint, location: TLocation) =>
    createAsset(
      version,
      amount,
      normalizeLocation(origin.api.localizeLocation(reserve.chain, location), version)
    )

  const assetsFilter = []

  if (overriddenAsset) {
    assetsFilter.push(
      ...overriddenAsset.map(asset =>
        localizeFilterAsset(asset.fun.Fungible, extractAssetLocation(asset))
      )
    )
  } else {
    if (!isRelayAsset && !isExternalChain(dest.chain))
      assetsFilter.push(
        createAsset(
          version,
          normalizeAmount(hopFees + destFee),
          origin.api.localizeLocation(reserve.chain, feeAssetLocation)
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
          Definite: sortAssets(assetsFilter)
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
      return [buyExecution, ...depositInstructions]
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
            xcm: [buyExecution, ...depositInstructions, ...setTopic]
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
          xcm: [buyExecution, ...depositInstructions, ...setTopic]
        }
      },
      ...setTopic
    ]
  }

  return [...depositInstructions, ...setTopic]
}
