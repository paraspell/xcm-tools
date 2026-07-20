/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { HopProcessParams, TDryRunChainResult } from '../../types'
import { type TDryRunOptions, type TDryRunResult } from '../../types'
import { addXcmVersionHeader, pickCompatibleXcmVersion } from '../../utils'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { createOriginLocation } from '../fees/getDestXcmFee'
import { resolveCurrency, resolveHopAsset } from '../utils'
import { inferFeeAsset } from '../utils/inferFeeAsset'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { getDryRunError } from './getDryRunError'
import { addEthereumBridgeFees, traverseXcmHops } from './traverseXcmHops'

export const dryRunInternal = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TDryRunOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TDryRunResult<TCustomChain>> => {
  const {
    api,
    origin,
    destination,
    currency,
    tx,
    sender,
    feeAsset,
    swapConfig,
    version,
    bypassOptions,
    useRootOrigin = false
  } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, origin, destination, currency)
    : undefined

  const { assets, asset } = resolveCurrency(api, currency, resolvedFeeAsset, origin, destination)

  const { amount } = asset

  const resolvedVersion = pickCompatibleXcmVersion(api, origin, destination, version)

  const originDryRun = await api.getDryRunCall({
    tx,
    chain: origin,
    destination,
    address: sender,
    asset: {
      ...asset,
      amount
    },
    assets,
    feeAsset: resolvedFeeAsset,
    version: resolvedVersion,
    bypassOptions,
    useRootOrigin: useRootOrigin || !!bypassOptions
  })

  if (!originDryRun.success) {
    return {
      success: false,
      dryRunError: { chainKind: 'origin', chain: origin, ...originDryRun.dryRunError },
      origin: originDryRun,
      hops: []
    }
  }

  const isMythosToEthereum = origin === 'Mythos' && destination === 'Ethereum'

  const originDryModified = isMythosToEthereum
    ? {
        ...originDryRun,
        fee: originDryRun.fee + (await getMythosOriginFee(api))
      }
    : originDryRun

  const { forwardedXcms: initialForwardedXcms, destParaId: initialDestParaId } = originDryModified

  const processHop = async (
    params: HopProcessParams<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TDryRunChainResult> => {
    const {
      api: hopApi,
      currentChain,
      currentOrigin,
      currentAsset,
      forwardedXcms,
      hasPassedExchange,
      isDestination
    } = params

    const resolvedHopAsset = resolveHopAsset({
      api,
      tx,
      originChain: origin,
      currentChain,
      destination,
      asset,
      currentAsset,
      currency,
      swapConfig,
      hasPassedExchange
    })

    const hopAsset = isDestination
      ? (inferFeeAsset(origin, destination, asset, api) ?? resolvedHopAsset)
      : resolvedHopAsset

    if (!api.hasDryRunSupport(currentChain)) {
      return {
        success: false,
        asset: currentAsset,
        dryRunError: { reason: `DryRunApi is not available on chain ${currentChain}` }
      }
    }

    const hopDryRun = await hopApi.getDryRunXcm({
      originLocation: addXcmVersionHeader(
        createOriginLocation(currentOrigin, currentChain, resolvedVersion, api._customCtx),
        resolvedVersion
      ),
      tx,
      xcm: forwardedXcms[1][0],
      chain: currentChain,
      origin: currentOrigin,
      asset: hopAsset,
      version: resolvedVersion,
      feeAsset: resolvedFeeAsset,
      originFee: originDryModified.fee,
      amount
    })

    return { ...hopDryRun, asset: hopAsset }
  }

  const traversalResult = await traverseXcmHops<
    TApi,
    TRes,
    TSigner,
    TDryRunChainResult,
    TCustomChain
  >({
    api,
    origin,
    destination,
    asset,
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
  const bridgeHubChain: TSubstrateChain = `BridgeHub${api.getRelayChainOf(origin)}`
  const assetHubChain: TSubstrateChain = `AssetHub${api.getRelayChainOf(origin)}`

  const bridgeHubHop = traversalResult.hops.find(hop => hop.chain === bridgeHubChain)

  // For Mythos → Ethereum, we skip additional Ethereum bridge fees (aligns with getXcmFeeInternal)
  const processedBridgeHub = isMythosToEthereum
    ? bridgeHubHop?.result
    : bridgeHubHop?.result.success
      ? await addEthereumBridgeFees(api, bridgeHubHop?.result, destination, assetHubChain)
      : bridgeHubHop?.result

  // Update bridge hub in hops if needed
  if (
    processedBridgeHub &&
    processedBridgeHub.success &&
    bridgeHubHop &&
    bridgeHubHop.result.success &&
    processedBridgeHub.fee !== bridgeHubHop.result.fee
  ) {
    const bridgeHubHopIndex = traversalResult.hops.findIndex(hop => hop.chain === bridgeHubChain)
    if (bridgeHubHopIndex !== -1 && traversalResult.hops[bridgeHubHopIndex].result.success) {
      traversalResult.hops[bridgeHubHopIndex].result = {
        ...traversalResult.hops[bridgeHubHopIndex].result,
        fee: processedBridgeHub.fee
      }
    }
  }

  const result = {
    origin: originDryModified,
    destination: traversalResult.destination,
    hops: traversalResult.hops
  }

  const dryRunError = getDryRunError({
    origin: { chain: origin, result: result.origin },
    destination: result.destination
      ? { chain: destination, result: result.destination }
      : undefined,
    hops: result.hops
  })

  return {
    success: !dryRunError,
    dryRunError,
    ...result
  }
}
