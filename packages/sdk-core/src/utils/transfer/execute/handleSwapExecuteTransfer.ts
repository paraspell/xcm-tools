import { hasXcmPaymentApiSupport, type TCurrencyCore } from '@paraspell/assets'
import type { TChain, TParachain, TSubstrateChain } from '@paraspell/sdk-common'
import { type TLocation } from '@paraspell/sdk-common'

import { getParaId } from '../../../chains/config'
import { MAX_WEIGHT, MIN_FEE } from '../../../constants'
import { DryRunFailedError, InvalidParameterError } from '../../../errors'
import { dryRunInternal } from '../../../transfer/dry-run/dryRunInternal'
import type {
  TCreateSwapXcmInternalOptions,
  TCreateSwapXcmOptions,
  TDryRunOptions,
  TDryRunResult,
  THopInfo,
  TSwapFeeEstimates,
  TWeight
} from '../../../types'
import { getChainVersion } from '../../chain'
import { padFeeBy } from '../../fees/padFee'
import { createExecuteCall } from './createExecuteCall'
import { createSwapExecuteXcm } from './createSwapExecuteXcm'

const FEE_PADDING_PERCENTAGE = 20

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
  chain: TSubstrateChain | undefined,
  hops: THopInfo[],
  exchangeChain: TParachain,
  destChain?: TChain
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
  chain: TSubstrateChain | undefined,
  dryRunResult: TDryRunResult,
  exchangeHopIndex: number,
  destChain?: TChain,
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
    // There is no exchange fee if origin is exchange, because jit_withdraw is used
    fees.exchangeFee = 0n
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

const createXcmAndCall = async <TApi, TRes>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes>,
  dryRunWeight?: TWeight
) => {
  const xcm = await createSwapExecuteXcm(options)

  const { api, chain, exchangeChain } = options

  const hasApiSupport = hasXcmPaymentApiSupport(chain ?? exchangeChain)
  const weight = hasApiSupport ? await api.getXcmWeight(xcm) : (dryRunWeight ?? MAX_WEIGHT)

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
    assetInfoFrom: assetFrom,
    assetInfoTo: assetTo,
    currencyTo,
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
      location: assetFrom.location as TLocation,
      amount: assetFrom.amount
    },
    swapConfig: {
      currencyTo: currencyTo as TCurrencyCore,
      exchangeChain
    },
    useRootOrigin: true
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

  const extractedFees = extractFeesFromDryRun(
    chain,
    firstDryRunResult,
    exchangeHopIndex,
    destChain,
    false
  )

  if (extractedFees.exchangeFee === 0n) {
    // We set the exchange fee to non-zero value to prevent creating dummy tx
    extractedFees.exchangeFee = MIN_FEE
  }

  // Calculate actual amount available for swap
  const totalFeesInFromAsset = chain
    ? extractedFees.originReserveFee + extractedFees.exchangeFee
    : 0n

  validateAmount(BigInt(assetFrom.amount), totalFeesInFromAsset)

  let updatedAssetTo = assetTo

  if (chain) {
    const amountAvailableForSwap = BigInt(assetFrom.amount) - totalFeesInFromAsset

    const recalculatedMinAmountOut = await calculateMinAmountOut(amountAvailableForSwap)

    updatedAssetTo = {
      ...assetTo,
      amount: recalculatedMinAmountOut
    }
  }

  const { call: finalCall } = await createXcmAndCall(
    { ...internalOptions, assetInfoTo: updatedAssetTo, fees: extractedFees },
    firstDryRunResult.origin.success ? firstDryRunResult.origin.weight : undefined
  )

  // If fees didn't change, use the second call
  return api.callTxMethod(finalCall)
}
