import {
  type TMultiLocation,
  type TNodeDotKsmWithRelayChains,
  type TNodePolkadotKusama,
  type TNodeWithRelayChains
} from '@paraspell/sdk-common'

import { DryRunFailedError, InvalidParameterError } from '../../../errors'
import { getParaId } from '../../../nodes/config'
import { dryRunInternal } from '../../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../../transfer/fees/padFee'
import type {
  TCreateSwapXcmInternalOptions,
  TCreateSwapXcmOptions,
  TDryRunOptions,
  TDryRunResult,
  THopInfo,
  TSwapFeeEstimates
} from '../../../types'
import { getChainVersion } from '../../chain'
import { createExecuteCall } from './createExecuteCall'
import { createSwapExecuteXcm } from './createSwapExecuteXcm'

const MIN_FEE = 1000n
const FEE_PADDING_PERCENTAGE = 40

const validateAmount = (amount: bigint, requiredFee: bigint): void => {
  if (amount <= requiredFee) {
    throw new InvalidParameterError(
      `Asset amount is too low, please increase the amount or use a different fee asset.`
    )
  }
}

const executeDryRun = async <TApi, TRes>(params: TDryRunOptions<TApi, TRes>) => {
  const result = await dryRunInternal(params)

  if (!result.origin.success) {
    throw new DryRunFailedError(result.failureReason as string, 'origin')
  }

  return result
}

const findExchangeHopIndex = (
  chain: TNodeDotKsmWithRelayChains | undefined,
  hops: THopInfo[],
  exchangeChain: TNodePolkadotKusama,
  destChain?: TNodeWithRelayChains
): number => {
  // If destChain is undefined, exchange chain is the final destination
  if (!destChain) {
    // Exchange is the final destination, so it's not in hops array
    return -1
  }

  const index = hops.findIndex(hop => hop.chain === exchangeChain)

  // If chain is defined but no exchange hop found, it might be because
  // the origin chain is the exchange chain (no hops needed)
  if (chain && index === -1 && chain !== exchangeChain) {
    throw new InvalidParameterError(
      `Exchange hop for ${exchangeChain} not found in dry run result.`
    )
  }

  return index
}

const extractFeesFromDryRun = (
  chain: TNodeDotKsmWithRelayChains | undefined,
  dryRunResult: TDryRunResult,
  exchangeHopIndex: number,
  destChain?: TNodeWithRelayChains,
  requireHopsSuccess: boolean = false
): TSwapFeeEstimates => {
  const fees: TSwapFeeEstimates = {
    originReserveFee: 0n,
    exchangeFee: 0n,
    destReserveFee: 0n
  }

  const hops = dryRunResult.hops

  // Handle exchange fee
  if (chain) {
    // If destChain is undefined, exchange is the final destination
    if (!destChain) {
      // Exchange fee comes from the final destination result
      if (dryRunResult.destination && !dryRunResult.destination.success && requireHopsSuccess) {
        throw new DryRunFailedError(
          `Exchange (destination) failed: ${dryRunResult.destination.failureReason || 'Unknown reason'}`
        )
      }
      if (dryRunResult.destination && dryRunResult.destination.success) {
        fees.exchangeFee = padFeeBy(dryRunResult.destination.fee, FEE_PADDING_PERCENTAGE)
      }
    } else {
      // Normal case: exchange is an intermediate hop
      const exchangeHop = hops[exchangeHopIndex]
      if (requireHopsSuccess && !exchangeHop.result.success) {
        throw new DryRunFailedError(
          `Exchange hop failed: ${exchangeHop.result.failureReason || 'Unknown reason'}`
        )
      }
      if (exchangeHop.result.success) {
        fees.exchangeFee = padFeeBy(exchangeHop.result.fee, FEE_PADDING_PERCENTAGE)
      }
    }
  } else {
    if (!dryRunResult.origin.success) {
      throw new DryRunFailedError(
        `Origin dry run failed: ${dryRunResult.origin.failureReason || 'Unknown reason'}`
      )
    }
    fees.exchangeFee = padFeeBy(dryRunResult.origin.fee, FEE_PADDING_PERCENTAGE)
  }

  // Handle origin reserve fee (hop before exchange)
  if (exchangeHopIndex > 0) {
    const hopBeforeExchange = hops[exchangeHopIndex - 1]
    if (requireHopsSuccess && !hopBeforeExchange.result.success) {
      throw new DryRunFailedError(
        `Hop before exchange failed: ${hopBeforeExchange.result.failureReason || 'Unknown reason'}`
      )
    }
    if (hopBeforeExchange.result.success) {
      fees.originReserveFee = padFeeBy(hopBeforeExchange.result.fee, FEE_PADDING_PERCENTAGE)
    }
  } else if (!destChain && hops.length > 0) {
    // Special case: when destChain is undefined and we have hops,
    // the last hop is the origin reserve fee (before reaching exchange destination)
    const lastHop = hops[hops.length - 1]
    if (requireHopsSuccess && !lastHop.result.success) {
      throw new DryRunFailedError(
        `Origin reserve hop failed: ${lastHop.result.failureReason || 'Unknown reason'}`
      )
    }
    if (lastHop.result.success) {
      fees.originReserveFee = padFeeBy(lastHop.result.fee, FEE_PADDING_PERCENTAGE)
    }
  }

  // Handle destination reserve fee (hop after exchange)
  // This only applies when destChain is defined and exchange is not the final destination
  if (destChain && exchangeHopIndex < hops.length - 1) {
    const hopAfterExchange = hops[exchangeHopIndex + 1]
    if (requireHopsSuccess && !hopAfterExchange.result.success) {
      throw new DryRunFailedError(
        `Hop after exchange failed: ${hopAfterExchange.result.failureReason || 'Unknown reason'}`
      )
    }
    if (hopAfterExchange.result.success) {
      fees.destReserveFee = padFeeBy(hopAfterExchange.result.fee, FEE_PADDING_PERCENTAGE)
    }
  }

  return fees
}

const createXcmAndCall = async <TApi, TRes>(options: TCreateSwapXcmInternalOptions<TApi, TRes>) => {
  const xcm = await createSwapExecuteXcm(options)

  const { api, chain, exchangeChain } = options

  const weight = await api.getXcmWeight(xcm)
  const call = createExecuteCall(chain ?? exchangeChain, xcm, weight)

  return { xcm, weight, call }
}

export const handleSwapExecuteTransfer = async <TApi, TRes>(
  options: TCreateSwapXcmOptions<TApi, TRes>
): Promise<TRes> => {
  const {
    api,
    chain,
    exchangeChain,
    destChain,
    assetFrom,
    assetTo,
    senderAddress,
    recipientAddress,
    calculateMinAmountOut
  } = options

  await api.init(chain ?? exchangeChain)

  validateAmount(BigInt(assetFrom.amount), MIN_FEE)

  const version = getChainVersion(chain ?? exchangeChain)

  const internalOptions = {
    ...options,
    version,
    paraIdTo: getParaId(destChain ?? exchangeChain)
  }

  const dryRunParams = {
    api,
    origin: chain ?? exchangeChain,
    destination: destChain ?? exchangeChain,
    senderAddress,
    address: recipientAddress,
    currency: {
      multilocation: assetFrom.multiLocation as TMultiLocation,
      amount: assetFrom.amount
    }
  }

  // First dry run with dummy fees to extract actual fees
  const { call: initialCall } = await createXcmAndCall({
    ...internalOptions,
    fees: {
      originReserveFee: MIN_FEE,
      exchangeFee: 0n,
      destReserveFee: MIN_FEE
    }
  })

  const firstDryRunResult = await executeDryRun({
    ...dryRunParams,
    tx: api.callTxMethod(initialCall)
  })

  const exchangeHopIndex = findExchangeHopIndex(
    chain,
    firstDryRunResult.hops,
    exchangeChain,
    destChain
  )

  // Check if there's a hop before exchange (origin reserve hop)
  const hasOriginReserveHop = destChain ? exchangeHopIndex > 0 : firstDryRunResult.hops.length > 0

  // If there's no origin reserve hop, we need the exchange hop/destination to succeed to get fees
  const requireExchangeSuccess = !hasOriginReserveHop

  const extractedFees = extractFeesFromDryRun(
    chain,
    firstDryRunResult,
    exchangeHopIndex,
    destChain,
    false
  )

  // If we need exchange to succeed but it failed, throw error
  if (requireExchangeSuccess && extractedFees.exchangeFee === 0n) {
    if (destChain) {
      const exchangeHop = firstDryRunResult.hops[exchangeHopIndex]
      if (!exchangeHop.result.success) {
        throw new DryRunFailedError(
          `Exchange hop failed when no origin reserve exists: ${exchangeHop.result.failureReason || 'Unknown reason'}`
        )
      }
    } else {
      if (firstDryRunResult.destination && !firstDryRunResult.destination.success) {
        throw new DryRunFailedError(
          `Exchange (destination) failed when no origin reserve exists: ${firstDryRunResult.destination.failureReason || 'Unknown reason'}`
        )
      }
    }
  }

  if (extractedFees.exchangeFee === 0n) {
    // We set the exchange fee to non-zero value to prevent creating dummy tx
    extractedFees.exchangeFee = MIN_FEE
  }

  // Calculate actual amount available for swap
  const totalFeesInFromAsset = chain
    ? extractedFees.originReserveFee + extractedFees.exchangeFee
    : 0n

  validateAmount(BigInt(assetFrom.amount), totalFeesInFromAsset)

  const amountAvailableForSwap = BigInt(assetFrom.amount) - totalFeesInFromAsset

  const recalculatedMinAmountOut = await calculateMinAmountOut(amountAvailableForSwap)

  const updatedAssetTo = {
    ...assetTo,
    amount: recalculatedMinAmountOut.toString()
  }

  // Second dry run with actual fees and amounts
  const { call: secondCall } = await createXcmAndCall({
    ...internalOptions,
    assetTo: updatedAssetTo,
    fees: extractedFees
  })

  const secondDryRunResult = await executeDryRun({
    ...dryRunParams,
    tx: api.callTxMethod(secondCall)
  })

  // Extract final fees from second dry run (now require all hops to succeed)
  let finalFees: TSwapFeeEstimates

  const hasHopsInSecondRun = secondDryRunResult.hops && secondDryRunResult.hops.length > 0
  const isOnExchangeChain = chain === exchangeChain

  if (hasHopsInSecondRun && !isOnExchangeChain) {
    const finalExchangeHopIndex = findExchangeHopIndex(
      chain,
      secondDryRunResult.hops,
      exchangeChain,
      destChain
    )
    finalFees = extractFeesFromDryRun(
      chain,
      secondDryRunResult,
      finalExchangeHopIndex,
      destChain,
      true
    )
  } else {
    finalFees = extractFeesFromDryRun(chain, secondDryRunResult, 0, destChain, true)
  }

  // Validate that we have enough after accounting for final fees
  const finalTotalFeesInFromAsset = chain ? finalFees.originReserveFee + finalFees.exchangeFee : 0n
  validateAmount(BigInt(assetFrom.amount), finalTotalFeesInFromAsset)

  // If the final fees are different, we might need one more iteration
  if (
    finalFees.exchangeFee !== extractedFees.exchangeFee ||
    finalFees.originReserveFee !== extractedFees.originReserveFee
  ) {
    const finalAmountAvailableForSwap = BigInt(assetFrom.amount) - finalTotalFeesInFromAsset
    const finalMinAmountOut = await calculateMinAmountOut(finalAmountAvailableForSwap)

    const finalAssetTo = {
      ...assetTo,
      amount: finalMinAmountOut.toString()
    }

    const { call: finalCall } = await createXcmAndCall({
      ...internalOptions,
      assetTo: finalAssetTo,
      fees: finalFees
    })

    return api.callTxMethod(finalCall)
  }

  // If fees didn't change, use the second call
  return api.callTxMethod(secondCall)
}
