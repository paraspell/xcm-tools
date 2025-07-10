/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { findAssetForNodeOrThrow, findAssetOnDestOrThrow } from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import {
  isRelayChain,
  type TEcosystemType,
  type TNodeDotKsmWithRelayChains
} from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type { HopTraversalConfig, HopTraversalResult } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getParaEthTransferFees } from '../ethTransfer'

export async function traverseXcmHops<TApi, TRes, THopResult>(
  config: HopTraversalConfig<TApi, TRes, THopResult>
): Promise<HopTraversalResult<THopResult>> {
  const {
    api,
    origin,
    destination,
    currency,
    initialForwardedXcms,
    initialDestParaId,
    swapConfig,
    processHop,
    shouldContinue,
    extractNextHopData
  } = config

  const assetHubNode = `AssetHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
  const bridgeHubNode = `BridgeHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains

  let currentOrigin = origin
  let forwardedXcms = initialForwardedXcms
  let nextParaId = initialDestParaId

  const asset = findAssetForNodeOrThrow(origin, currency, destination)
  let currentAsset =
    origin === swapConfig?.exchangeChain
      ? findAssetForNodeOrThrow(swapConfig.exchangeChain, swapConfig.currencyTo, null)
      : asset

  let hasPassedExchange = origin === swapConfig?.exchangeChain

  const hops: Array<{ chain: TNodeDotKsmWithRelayChains; result: THopResult }> = []
  const intermediateResults: Partial<{ assetHub?: THopResult; bridgeHub?: THopResult }> = {}
  let destinationResult: THopResult | undefined

  while (
    Array.isArray(forwardedXcms) &&
    forwardedXcms.length > 0 &&
    forwardedXcms[1].length > 0 &&
    ('disconnect' in (api.getApi() as object)
      ? Object.values(forwardedXcms[1][0]).length
      : forwardedXcms[1][0].value.length) > 0 &&
    nextParaId !== undefined
  ) {
    const nextChain = getTNode(nextParaId, getRelayChainOf(origin).toLowerCase() as TEcosystemType)

    if (!nextChain) {
      throw new InvalidParameterError(`Unable to find TNode for paraId ${nextParaId}`)
    }

    const hopApi = api.clone()

    try {
      await hopApi.init(nextChain, DRY_RUN_CLIENT_TIMEOUT_MS)

      const isDestination =
        nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))
      const isAssetHub = nextChain === assetHubNode
      const isBridgeHub = nextChain === bridgeHubNode

      const hopResult = await processHop({
        api: hopApi,
        currentChain: nextChain as TNodeDotKsmWithRelayChains,
        currentOrigin,
        currentAsset,
        forwardedXcms,
        hasPassedExchange,
        isDestination,
        isAssetHub,
        isBridgeHub
      })

      if (!isDestination) {
        hops.push({
          chain: nextChain as TNodeDotKsmWithRelayChains,
          result: hopResult
        })
      }

      if (isDestination) {
        destinationResult = hopResult
      } else if (isAssetHub) {
        intermediateResults.assetHub = hopResult
      } else if (isBridgeHub) {
        intermediateResults.bridgeHub = hopResult
      }

      if (!shouldContinue(hopResult)) {
        break
      }

      // Update state for next iteration
      if (swapConfig && nextChain === swapConfig.exchangeChain) {
        hasPassedExchange = true
        currentAsset = findAssetOnDestOrThrow(
          swapConfig.exchangeChain,
          nextChain,
          swapConfig.currencyTo
        )
      }

      const { forwardedXcms: newXcms, destParaId } = extractNextHopData(hopResult)
      forwardedXcms = newXcms
      nextParaId = destParaId
      currentOrigin = nextChain as TNodeDotKsmWithRelayChains
    } finally {
      await hopApi.disconnect()
    }
  }

  return {
    hops,
    // assetHub, bridgeHub keys will be removed in the next major version
    ...(intermediateResults.assetHub && { assetHub: intermediateResults.assetHub }),
    ...(intermediateResults.bridgeHub && { bridgeHub: intermediateResults.bridgeHub }),
    ...(destinationResult && { destination: destinationResult }),
    lastProcessedChain: currentOrigin
  }
}

export const addEthereumBridgeFees = async <TApi, TRes, TResult extends { fee?: bigint }>(
  api: IPolkadotApi<TApi, TRes>,
  bridgeHubResult: TResult | undefined,
  destination: TNodeWithRelayChains,
  assetHubNode: TNodeDotKsmWithRelayChains
): Promise<TResult | undefined> => {
  if (!bridgeHubResult || !('fee' in bridgeHubResult) || destination !== 'Ethereum') {
    return bridgeHubResult
  }

  const ahApi = api.clone()
  await ahApi.init(assetHubNode, DRY_RUN_CLIENT_TIMEOUT_MS)
  const [bridgeFee] = await getParaEthTransferFees(ahApi)

  return {
    ...bridgeHubResult,
    fee: (bridgeHubResult.fee as bigint) + bridgeFee
  }
}
