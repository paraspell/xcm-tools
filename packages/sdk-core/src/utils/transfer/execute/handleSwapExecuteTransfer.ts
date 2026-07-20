import { isAssetEqual } from '@paraspell/assets'
import {
  isExternalChain,
  type TChain,
  type TParachain,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { getParaId } from '../../../chains/config'
import { MAX_WEIGHT, MIN_FEE } from '../../../constants'
import { AmountTooLowError, DryRunFailedError, RoutingResolutionError } from '../../../errors'
import { dryRunInternal } from '../../../transfer/dry-run/dryRunInternal'
import type {
  TCreateSwapXcmInternalOptions,
  TCreateSwapXcmOptions,
  TDryRunOptions,
  TDryRunResult,
  TSwapFeeEstimates,
  TWeight
} from '../../../types'
import { assertCurrencyCore } from '../../assertions'
import { getRelayChainOf } from '../../chain'
import { padValueBy } from '../../fees/padFee'
import { parseUnits } from '../../unit'
import { pickRouterCompatibleXcmVersion } from '../../xcm-version'
import { createExecuteCall } from './createExecuteCall'
import { createSwapExecuteXcm } from './createSwapExecuteXcm'

const FEE_PADDING_PERCENTAGE = 20

const validateAmount = (amount: bigint, requiredFee: bigint): void => {
  if (amount <= requiredFee) {
    throw new AmountTooLowError(
      `Asset amount is too low, please increase the amount or use a different fee asset.`
    )
  }
}

const calculateTotalFees = (chain: TSubstrateChain | undefined, fees: TSwapFeeEstimates): bigint =>
  chain ? fees.originReserveFee + fees.exchangeFee : 0n

const executeDryRun = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  params: TDryRunOptions<TApi, TRes, TSigner, TCustomChain>
) => {
  const result = await dryRunInternal(params)

  if (!result.origin.success) {
    throw new DryRunFailedError({
      chainKind: 'origin',
      chain: params.origin,
      ...result.origin.dryRunError
    })
  }

  return result
}

const findExchangeHopIndex = <TCustomChain extends string = never>(
  chain: TSubstrateChain | undefined,
  dryRunResult: TDryRunResult<TCustomChain>,
  exchangeChain: TParachain,
  destChain?: TChain
): number => {
  // If destChain is undefined, exchange chain is the final destination
  if (!destChain) {
    // Exchange is the final destination, so it's not in hops array
    return -1
  }

  const index = dryRunResult.hops.findIndex(hop => hop.chain === exchangeChain)

  // If chain is defined but no exchange hop found, it might be because
  // the origin chain is the exchange chain (no hops needed)
  if (chain && index === -1 && chain !== exchangeChain) {
    throw new RoutingResolutionError(
      `Exchange hop for ${exchangeChain} not found in dry run result.`
    )
  }

  return index
}

const extractFeesFromDryRun = <TCustomChain extends string = never>(
  chain: TSubstrateChain | undefined,
  exchangeChain: TParachain,
  dryRunResult: TDryRunResult<TCustomChain>,
  exchangeHopIndex: number,
  destChain?: TChain,
  requireHopsSuccess: boolean = false
): TSwapFeeEstimates => {
  const fees: TSwapFeeEstimates = {
    originFee: 0n,
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
          {
            ...dryRunResult.destination.dryRunError,
            chainKind: 'destination',
            chain: exchangeChain
          },
          'Exchange (destination):'
        )
      }
      if (dryRunResult.destination && dryRunResult.destination.success) {
        fees.exchangeFee = padValueBy(dryRunResult.destination.fee, FEE_PADDING_PERCENTAGE)
      }
    } else {
      // Normal case: exchange is an intermediate hop
      const exchangeHop = hops[exchangeHopIndex]
      if (requireHopsSuccess && !exchangeHop.result.success) {
        throw new DryRunFailedError(
          { ...exchangeHop.result.dryRunError, chainKind: 'hop', chain: exchangeHop.chain },
          'Exchange hop:'
        )
      }
      if (exchangeHop.result.success) {
        fees.exchangeFee = padValueBy(exchangeHop.result.fee, FEE_PADDING_PERCENTAGE)
      }
    }
  } else {
    if (!dryRunResult.origin.success) {
      throw new DryRunFailedError(
        { ...dryRunResult.origin.dryRunError, chainKind: 'origin', chain: exchangeChain },
        'Origin:'
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
        {
          ...hopBeforeExchange.result.dryRunError,
          chainKind: 'hop',
          chain: hopBeforeExchange.chain
        },
        'Hop before exchange:'
      )
    }
    if (hopBeforeExchange.result.success) {
      fees.originReserveFee = padValueBy(hopBeforeExchange.result.fee, FEE_PADDING_PERCENTAGE)
    }
  } else if (!destChain && hops.length > 0) {
    // Special case: when destChain is undefined and we have hops,
    // the last hop is the origin reserve fee (before reaching exchange destination)
    const lastHop = hops[hops.length - 1]
    if (requireHopsSuccess && !lastHop.result.success) {
      throw new DryRunFailedError(
        { ...lastHop.result.dryRunError, chainKind: 'hop', chain: lastHop.chain },
        'Origin reserve hop:'
      )
    }
    if (lastHop.result.success) {
      fees.originReserveFee = padValueBy(lastHop.result.fee, FEE_PADDING_PERCENTAGE)
    }
  }

  // Handle destination reserve fee (hop after exchange)
  // This only applies when destChain is defined and exchange is not the final destination
  if (destChain && exchangeHopIndex < hops.length - 1) {
    const hopAfterExchange = hops[exchangeHopIndex + 1]
    if (requireHopsSuccess && !hopAfterExchange.result.success) {
      throw new DryRunFailedError(
        { ...hopAfterExchange.result.dryRunError, chainKind: 'hop', chain: hopAfterExchange.chain },
        'Hop after exchange:'
      )
    }
    if (hopAfterExchange.result.success) {
      fees.destReserveFee = padValueBy(hopAfterExchange.result.fee, FEE_PADDING_PERCENTAGE)
    }
  }

  return fees
}

const createXcmAndCall = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes, TSigner, TCustomChain>,
  dryRunWeight?: TWeight
) => {
  const xcm = await createSwapExecuteXcm(options)

  const { api, chain, exchangeChain } = options

  const hasApiSupport = api.hasXcmPaymentApiSupport(chain ?? exchangeChain)
  const weight = hasApiSupport ? await api.getXcmWeight(xcm) : (dryRunWeight ?? MAX_WEIGHT)

  const call = createExecuteCall(chain ?? exchangeChain, xcm, weight)

  return { xcm, weight, call }
}

export const handleSwapExecuteTransfer = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TCreateSwapXcmOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TRes> => {
  const {
    api,
    chain,
    exchangeChain,
    destChain,
    assetInfoFrom: assetFrom,
    assetInfoTo: assetTo,
    currencyTo,
    feeAssetInfo,
    sender,
    recipient,
    calculateMinAmountOut
  } = options

  assertCurrencyCore(currencyTo)

  await api.init(chain ?? exchangeChain)

  validateAmount(assetFrom.amount, MIN_FEE)

  const version = pickRouterCompatibleXcmVersion(api, chain, exchangeChain, destChain)

  const isEthereumDest = destChain !== undefined && isExternalChain(destChain)

  // When main asset is DOT and dest is Ethereum, fees come from the same asset
  // (no separate fee asset needed). Only skip fee validation when currencies differ.
  const hasSeparateFeeAsset =
    isEthereumDest &&
    !isAssetEqual(
      assetFrom,
      api.findNativeAssetInfoOrThrow(getRelayChainOf(chain ?? exchangeChain))
    )

  const internalOptions = {
    ...options,
    version,
    paraIdTo: getParaId(destChain ?? exchangeChain)
  }

  const dryRunParams = {
    api,
    origin: chain ?? exchangeChain,
    destination: destChain ?? exchangeChain,
    sender,
    recipient,
    version,
    currency: {
      location: assetFrom.location,
      amount: assetFrom.amount
    },
    feeAsset: feeAssetInfo ? { location: feeAssetInfo.location } : undefined,
    swapConfig: {
      currencyTo,
      exchangeChain,
      amountOut: assetTo.amount
    },
    useRootOrigin: true
  }

  const FEE_ASSET_AMOUNT = 100

  const dummyOriginFee = feeAssetInfo
    ? parseUnits(FEE_ASSET_AMOUNT.toString(), feeAssetInfo.decimals)
    : 0n

  const fees: TSwapFeeEstimates = {
    originFee: dummyOriginFee,
    originReserveFee: MIN_FEE,
    exchangeFee: 0n,
    destReserveFee: MIN_FEE
  }

  const totalFeesPre = calculateTotalFees(chain, fees)

  if (!hasSeparateFeeAsset) {
    validateAmount(assetFrom.amount, totalFeesPre)
  }

  // First dry run with dummy fees to extract actual fees
  const { call: initialCall } = await createXcmAndCall({
    ...internalOptions,
    assetInfoTo: {
      ...assetTo,
      // Use half of the amountOut in initial dryRun to prevent NoDeal error in dry run
      amount: assetTo.amount / 2n
    },
    fees
  })

  const firstDryRunResult = await executeDryRun({
    ...dryRunParams,
    tx: api.deserializeExtrinsics(initialCall)
  })

  if (firstDryRunResult.dryRunError?.reason === 'NotHoldingFees') {
    throw new AmountTooLowError(
      `Asset amount is too low to cover the fees, please increase the amount.`
    )
  }

  const exchangeHopIndex = findExchangeHopIndex(chain, firstDryRunResult, exchangeChain, destChain)

  const extractedFees = extractFeesFromDryRun(
    chain,
    exchangeChain,
    firstDryRunResult,
    exchangeHopIndex,
    destChain,
    false
  )

  // Set originFee from dry run origin fee (padded), same as handleExecuteTransfer
  extractedFees.originFee =
    feeAssetInfo && firstDryRunResult.origin.success
      ? padValueBy(firstDryRunResult.origin.fee, FEE_PADDING_PERCENTAGE)
      : 0n

  if (extractedFees.exchangeFee === 0n) {
    // We set the exchange fee to non-zero value to prevent creating dummy tx
    extractedFees.exchangeFee = MIN_FEE
  }
  const totalFees = calculateTotalFees(chain, extractedFees)

  if (!hasSeparateFeeAsset) {
    validateAmount(assetFrom.amount, totalFees)
  }

  let updatedAssetTo = assetTo

  if (chain) {
    // When fees are paid from a separate asset (e.g. DOT for Ethereum),
    // the full main asset amount is available for the swap
    const amountAvailableForSwap = hasSeparateFeeAsset
      ? assetFrom.amount
      : assetFrom.amount - totalFees

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

  return api.deserializeExtrinsics(finalCall)
}
