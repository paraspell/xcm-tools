import type {
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama
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
import { isMultiHopSwap } from './isMultiHopSwap'

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
    throw new DryRunFailedError(result.failureReason as string)
  }

  return result
}

const findExchangeHopIndex = (
  chain: TNodeDotKsmWithRelayChains | undefined,
  hops: THopInfo[],
  exchangeChain: TNodePolkadotKusama
): number => {
  const index = hops.findIndex(hop => hop.chain === exchangeChain)

  if (chain && index === -1) {
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
  requireHopsSuccess: boolean = false
): TSwapFeeEstimates => {
  const fees: TSwapFeeEstimates = {
    originReserveFee: 0n,
    exchangeFee: 0n,
    destReserveFee: 0n
  }

  const hops = dryRunResult.hops

  if (chain) {
    const exchangeHop = hops[exchangeHopIndex]
    if (!exchangeHop.result.success) {
      throw new DryRunFailedError(
        `Exchange hop failed: ${exchangeHop.result.failureReason || 'Unknown reason'}`
      )
    }

    fees.exchangeFee = padFeeBy(exchangeHop.result.fee, FEE_PADDING_PERCENTAGE)
  } else {
    if (!dryRunResult.origin.success) {
      throw new DryRunFailedError(
        `Origin dry run failed: ${dryRunResult.origin.failureReason || 'Unknown reason'}`
      )
    }
    fees.exchangeFee = padFeeBy(dryRunResult.origin.fee, FEE_PADDING_PERCENTAGE)
  }

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
  }

  if (exchangeHopIndex < hops.length - 1) {
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

const validateHops = (hops: THopInfo[] | undefined): void => {
  if (!hops || hops.length === 0) {
    throw new InvalidParameterError('No hops found in dry run result. Exchange hop is required.')
  }
}

const createXcmAndCall = async <TApi, TRes>(options: TCreateSwapXcmInternalOptions<TApi, TRes>) => {
  const xcm = await createSwapExecuteXcm(options)

  const { api } = options

  const weight = await api.getXcmWeight(xcm)
  const call = createExecuteCall(xcm, weight)

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

  // Extract fees from first dry run
  if (chain) validateHops(firstDryRunResult.hops)
  const exchangeHopIndex = findExchangeHopIndex(chain, firstDryRunResult.hops, exchangeChain)
  const extractedFees = extractFeesFromDryRun(chain, firstDryRunResult, exchangeHopIndex)

  const needsMultiHop = isMultiHopSwap(exchangeChain, assetFrom, assetTo)

  const adjustedExchangeFee = needsMultiHop ? extractedFees.exchangeFee : extractedFees.exchangeFee

  // Calculate actual amount available for swap
  const totalFeesInFromAsset = extractedFees.originReserveFee + adjustedExchangeFee
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

  // Extract final fees from second dry run
  if (chain) validateHops(secondDryRunResult.hops)
  const finalExchangeHopIndex = findExchangeHopIndex(chain, secondDryRunResult.hops, exchangeChain)
  const finalFees = extractFeesFromDryRun(
    chain,
    secondDryRunResult,
    finalExchangeHopIndex,
    true // Require all hops to succeed
  )

  const finalTotalFeesInFromAsset = finalFees.originReserveFee + finalFees.exchangeFee
  validateAmount(BigInt(assetFrom.amount), finalTotalFeesInFromAsset)

  const { call: finalCall } = await createXcmAndCall({
    ...internalOptions,
    assetTo: updatedAssetTo,
    fees: finalFees
  })

  return api.callTxMethod(finalCall)
}
