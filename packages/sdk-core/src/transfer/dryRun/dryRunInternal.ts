/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import {
  findAssetForNodeOrThrow,
  findAssetOnDestOrThrow,
  getNativeAssetSymbol,
  hasDryRunSupport
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type {
  HopProcessParams,
  TDryRunChain,
  TDryRunNodeResult,
  TDryRunNodeResultInternal,
  THopInfo
} from '../../types'
import { type TDryRunOptions, type TDryRunResult } from '../../types'
import { addXcmVersionHeader, getRelayChainOf } from '../../utils'
import { createOriginLocation } from '../fees/getDestXcmFee'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { addEthereumBridgeFees, traverseXcmHops } from './traverseXcmHops'

const getFailureInfo = (
  results: Partial<Record<TDryRunChain, TDryRunNodeResultInternal | undefined>>,
  hops: THopInfo[]
): { failureReason?: string; failureChain?: TDryRunChain } => {
  // Check standard chains first for backwards compatibility
  for (const chain of ['destination', 'assetHub', 'bridgeHub'] as TDryRunChain[]) {
    const res = results[chain]
    if (res && !res.success && res.failureReason) {
      return { failureReason: res.failureReason, failureChain: chain }
    }
  }

  for (const hop of hops) {
    if (!hop.result.success && hop.result.failureReason) {
      return { failureReason: hop.result.failureReason, failureChain: hop.chain }
    }
  }

  return {}
}

export const dryRunInternal = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { origin, destination, currency, api, tx, senderAddress, feeAsset, swapConfig } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const asset = findAssetForNodeOrThrow(origin, currency, destination)

  const originDryRun = await api.getDryRunCall({
    tx,
    node: origin,
    address: senderAddress,
    feeAsset: resolvedFeeAsset
  })

  if (!originDryRun.success) {
    return {
      failureReason: originDryRun.failureReason,
      failureChain: 'origin',
      origin: originDryRun,
      hops: []
    }
  }

  const { forwardedXcms: initialForwardedXcms, destParaId: initialDestParaId } = originDryRun

  const processHop = async (params: HopProcessParams<TApi, TRes>): Promise<TDryRunNodeResult> => {
    const {
      api: hopApi,
      currentChain,
      currentOrigin,
      currentAsset,
      forwardedXcms,
      hasPassedExchange,
      isDestination
    } = params

    if (!hasDryRunSupport(currentChain)) {
      return {
        success: false,
        failureReason: `DryRunApi is not available on node ${currentChain}`
      }
    }

    const hopDryRun = await hopApi.getDryRunXcm({
      originLocation: addXcmVersionHeader(
        createOriginLocation(currentOrigin, currentChain),
        Version.V4
      ),
      xcm: forwardedXcms[1][0],
      node: currentChain,
      origin: currentOrigin,
      asset: currentAsset,
      feeAsset: resolvedFeeAsset,
      originFee: originDryRun.fee,
      amount: BigInt((currency as WithAmount<TCurrencyCore>).amount)
    })

    // Add currency information
    if (hopDryRun.success) {
      let hopCurrency: string

      if (
        destination === 'Ethereum' &&
        (currentChain.includes('AssetHub') || currentChain.includes('BridgeHub'))
      ) {
        hopCurrency = getNativeAssetSymbol(currentChain)
      } else if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
        hopCurrency = findAssetOnDestOrThrow(
          swapConfig.exchangeChain,
          currentChain,
          swapConfig.currencyTo
        ).symbol
      } else if (isDestination) {
        hopCurrency = findAssetOnDestOrThrow(origin, currentChain, currency).symbol
      } else {
        hopCurrency = asset.symbol
      }

      return { ...hopDryRun, currency: hopCurrency }
    }

    return hopDryRun
  }

  const traversalResult = await traverseXcmHops({
    api,
    origin,
    destination,
    currency: currency as TCurrencyCore,
    initialForwardedXcms,
    initialDestParaId,
    swapConfig,
    processHop,
    shouldContinue: hopResult => hopResult.success,
    extractNextHopData: hopResult => ({
      forwardedXcms: hopResult.success ? hopResult.forwardedXcms : undefined,
      destParaId: hopResult.success ? hopResult.destParaId : undefined
    })
  })

  // Process Ethereum bridge fees
  const assetHubNode = `AssetHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
  const bridgeHubNode = `BridgeHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
  const processedBridgeHub = traversalResult.bridgeHub?.success
    ? await addEthereumBridgeFees(api, traversalResult.bridgeHub, destination, assetHubNode)
    : traversalResult.bridgeHub

  // Update bridge hub in hops if needed
  if (
    processedBridgeHub &&
    processedBridgeHub.success &&
    traversalResult.bridgeHub &&
    traversalResult.bridgeHub.success &&
    processedBridgeHub.fee !== traversalResult.bridgeHub.fee
  ) {
    const bridgeHubHopIndex = traversalResult.hops.findIndex(hop => hop.chain === bridgeHubNode)
    if (bridgeHubHopIndex !== -1 && traversalResult.hops[bridgeHubHopIndex].result.success) {
      traversalResult.hops[bridgeHubHopIndex].result = {
        ...traversalResult.hops[bridgeHubHopIndex].result,
        fee: processedBridgeHub.fee
      }
    }
  }

  const originWithCurrency = originDryRun.success
    ? {
        ...originDryRun,
        currency: resolvedFeeAsset ? resolvedFeeAsset.symbol : getNativeAssetSymbol(origin)
      }
    : originDryRun

  const assetHubWithCurrency = traversalResult.assetHub?.success
    ? {
        ...traversalResult.assetHub,
        currency: resolvedFeeAsset ? resolvedFeeAsset.symbol : getNativeAssetSymbol(assetHubNode)
      }
    : traversalResult.assetHub

  const bridgeHubWithCurrency = processedBridgeHub?.success
    ? { ...processedBridgeHub, currency: getNativeAssetSymbol(bridgeHubNode) }
    : processedBridgeHub

  const destinationWithCurrency = traversalResult.destination?.success
    ? { ...traversalResult.destination, currency: asset?.symbol }
    : traversalResult.destination

  const { failureReason, failureChain } = getFailureInfo(
    {
      destination: destinationWithCurrency,
      assetHub: assetHubWithCurrency,
      bridgeHub: bridgeHubWithCurrency
    },
    traversalResult.hops
  )

  return {
    failureReason,
    failureChain,
    origin: originWithCurrency,
    assetHub: assetHubWithCurrency,
    bridgeHub: bridgeHubWithCurrency,
    destination: destinationWithCurrency,
    hops: traversalResult.hops
  }
}
