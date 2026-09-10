/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { BRIDGE_PALLETS, getPalletIndex } from '@paraspell/pallets'
import {
  isExternalChain,
  isSubstrateBridge,
  isSubstrateChain,
  type TChain,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getTSubstrateChain } from '../../chains/getTChain'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { RoutingResolutionError } from '../../errors'
import type { HopTraversalConfig, HopTraversalResult } from '../../types'
import { getChainLocation } from '../../utils'
import { getParaEthTransferFees } from '../eth-transfer'

const resolveBridgedHop = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  currentChain: TSubstrateChain,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms: any
) => {
  if (isExternalChain(destination) || !isSubstrateBridge(origin, destination)) return undefined

  const originRelay = api.getRelayChainOf(origin)
  const destBridgeHub = `BridgeHub${api.getRelayChainOf(destination)}`
  const messagesPallet = BRIDGE_PALLETS.find(pallet => pallet === `Bridge${originRelay}Messages`)

  if (
    !messagesPallet ||
    !isSubstrateChain(destBridgeHub) ||
    currentChain !== `BridgeHub${originRelay}`
  )
    return undefined

  const palletIndex = getPalletIndex(destBridgeHub, messagesPallet)

  if (palletIndex === undefined) {
    throw new RoutingResolutionError(
      `Unable to find ${messagesPallet} pallet index on ${destBridgeHub}`
    )
  }

  return {
    forwardedXcms: api.createBridgedForwardedXcms(forwardedXcms[1][0], {
      palletIndex,
      relay: originRelay,
      paraId: api.getParaId(origin),
      destination: getChainLocation(destBridgeHub, destination, api._customCtx)
    }),
    destParaId: api.getParaId(destination),
    currentOrigin: destBridgeHub
  }
}

export const traverseXcmHops = async <
  TApi,
  TRes,
  TSigner,
  THopResult,
  TCustomChain extends string = never
>(
  config: HopTraversalConfig<TApi, TRes, TSigner, THopResult, TCustomChain>
): Promise<HopTraversalResult<THopResult, TCustomChain>> => {
  const {
    api,
    origin,
    destination,
    asset,
    initialForwardedXcms,
    initialDestParaId,
    swapConfig,
    processHop,
    shouldContinue,
    extractNextHopData
  } = config

  let currentOrigin = origin
  let forwardedXcms = initialForwardedXcms
  let nextParaId = initialDestParaId

  let currentAsset =
    origin === swapConfig?.exchangeChain
      ? api.findAssetInfoOrThrow(swapConfig.exchangeChain, swapConfig.currencyTo)
      : asset

  let hasPassedExchange = origin === swapConfig?.exchangeChain

  const hops: Array<{ chain: TSubstrateChain; result: THopResult }> = []
  let destinationResult: THopResult | undefined

  while (
    Array.isArray(forwardedXcms) &&
    forwardedXcms.length > 0 &&
    forwardedXcms[1].length > 0 &&
    ('disconnect' in (api.api as object)
      ? Object.values(forwardedXcms[1][0]).length
      : forwardedXcms[1][0].value.length) > 0 &&
    nextParaId !== undefined
  ) {
    const nextChain = getTSubstrateChain(nextParaId, api.getRelayChainOf(currentOrigin))

    if (!nextChain) {
      throw new RoutingResolutionError(`Unable to find TChain for paraId ${nextParaId}`)
    }

    const hopApi = api.clone()

    try {
      await hopApi.init(nextChain, DRY_RUN_CLIENT_TIMEOUT_MS)

      // true if this hop should be treated as the destination
      // - normally when nextChain === destination
      // - but if swap is required, only after (or on) the exchange hop
      const isDestination =
        nextChain === destination &&
        (!swapConfig || hasPassedExchange || nextChain === swapConfig.exchangeChain)

      const hopResult = await processHop({
        api: hopApi,
        currentChain: nextChain,
        currentOrigin,
        currentAsset,
        forwardedXcms,
        hasPassedExchange,
        isDestination
      })

      if (!isDestination) {
        hops.push({
          chain: nextChain,
          result: hopResult
        })
      }

      if (isDestination) {
        destinationResult = hopResult
      }

      if (!shouldContinue(hopResult)) {
        break
      }

      // Update state for next iteration
      if (swapConfig && nextChain === swapConfig.exchangeChain) {
        hasPassedExchange = true
        currentAsset = api.findAssetOnDestOrThrow(
          swapConfig.exchangeChain,
          nextChain,
          swapConfig.currencyTo
        )
      }

      const next = resolveBridgedHop(api, origin, destination, nextChain, forwardedXcms) ?? {
        ...extractNextHopData(hopResult),
        currentOrigin: nextChain
      }
      forwardedXcms = next.forwardedXcms
      nextParaId = next.destParaId
      currentOrigin = next.currentOrigin
    } finally {
      await hopApi.disconnect()
    }
  }

  return {
    hops,
    ...(destinationResult && { destination: destinationResult }),
    lastProcessedChain: currentOrigin
  }
}

export const addEthereumBridgeFees = async <
  TApi,
  TRes,
  TSigner,
  TResult extends { fee?: bigint },
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  bridgeHubResult: TResult | undefined,
  destination: TChain,
  assetHubChain: TSubstrateChain
): Promise<TResult | undefined> => {
  if (!bridgeHubResult || !('fee' in bridgeHubResult) || !isExternalChain(destination)) {
    return bridgeHubResult
  }

  const ahApi = api.clone()
  await ahApi.init(assetHubChain, DRY_RUN_CLIENT_TIMEOUT_MS)
  const [bridgeFee] = await getParaEthTransferFees(ahApi)

  return {
    ...bridgeHubResult,
    fee: (bridgeHubResult.fee as bigint) + bridgeFee
  }
}
