/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow, hasDryRunSupport } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { HopProcessParams, TDryRunChainResult } from '../../types'
import { type TDryRunOptions, type TDryRunResult } from '../../types'
import {
  abstractDecimals,
  addXcmVersionHeader,
  getRelayChainOf,
  pickCompatibleXcmVersion
} from '../../utils'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { createOriginLocation } from '../fees/getDestXcmFee'
import { resolveHopAsset } from '../utils'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { getFailureInfo } from './getFailureInfo'
import { addEthereumBridgeFees, traverseXcmHops } from './traverseXcmHops'

export const dryRunInternal = async <TApi, TRes, TSigner>(
  options: TDryRunOptions<TApi, TRes, TSigner>
): Promise<TDryRunResult> => {
  const {
    api,
    origin,
    destination,
    currency,
    tx,
    senderAddress,
    feeAsset,
    swapConfig,
    version,
    bypassOptions,
    useRootOrigin = false
  } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const asset = findAssetInfoOrThrow(origin, currency, destination)

  const amount = abstractDecimals(
    (currency as WithAmount<TCurrencyCore>).amount,
    asset.decimals,
    api
  )

  const resolvedVersion = pickCompatibleXcmVersion(origin, destination, version)

  const originDryRun = await api.getDryRunCall({
    tx,
    chain: origin,
    destination,
    address: senderAddress,
    asset: {
      ...asset,
      amount
    },
    feeAsset: resolvedFeeAsset,
    version: resolvedVersion,
    bypassOptions,
    useRootOrigin: useRootOrigin || !!bypassOptions
  })

  if (!originDryRun.success) {
    return {
      failureReason: originDryRun.failureReason,
      failureSubReason: originDryRun.failureSubReason,
      failureChain: 'origin',
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
    params: HopProcessParams<TApi, TRes, TSigner>
  ): Promise<TDryRunChainResult> => {
    const {
      api: hopApi,
      currentChain,
      currentOrigin,
      currentAsset,
      forwardedXcms,
      hasPassedExchange
    } = params

    const hopAsset = resolveHopAsset({
      api,
      tx,
      originChain: origin,
      currentChain,
      destination,
      asset: currentAsset,
      currency,
      swapConfig,
      hasPassedExchange
    })

    if (!hasDryRunSupport(currentChain)) {
      return {
        success: false,
        asset: currentAsset,
        failureReason: `DryRunApi is not available on chain ${currentChain}`
      }
    }

    const hopDryRun = await hopApi.getDryRunXcm({
      originLocation: addXcmVersionHeader(
        createOriginLocation(currentOrigin, currentChain),
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
  const bridgeHubChain = `BridgeHub${getRelayChainOf(origin)}` as TSubstrateChain
  const assetHubChain = `AssetHub${getRelayChainOf(origin)}` as TSubstrateChain

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

  const result: TDryRunResult = {
    origin: originDryModified,
    destination: traversalResult.destination,
    hops: traversalResult.hops
  }

  return {
    ...getFailureInfo(result),
    ...result
  }
}
