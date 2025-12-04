/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { findAssetInfoOrThrow, findAssetOnDestOrThrow } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { getTChain } from '../../chains/getTChain'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import type { HopTraversalConfig, HopTraversalResult } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getParaEthTransferFees } from '../eth-transfer'

export const traverseXcmHops = async <TApi, TRes, THopResult>(
  config: HopTraversalConfig<TApi, TRes, THopResult>
): Promise<HopTraversalResult<THopResult>> => {
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

  let currentOrigin = origin
  let forwardedXcms = initialForwardedXcms
  let nextParaId = initialDestParaId

  const asset = findAssetInfoOrThrow(origin, currency, destination)
  let currentAsset =
    origin === swapConfig?.exchangeChain
      ? findAssetInfoOrThrow(swapConfig.exchangeChain, swapConfig.currencyTo, null)
      : asset

  let hasPassedExchange = origin === swapConfig?.exchangeChain

  const hops: Array<{ chain: TSubstrateChain; result: THopResult }> = []
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
    const nextChain = getTChain(nextParaId, getRelayChainOf(origin))

    if (!nextChain) {
      throw new InvalidParameterError(`Unable to find TChain for paraId ${nextParaId}`)
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
        currentChain: nextChain as TSubstrateChain,
        currentOrigin,
        currentAsset,
        forwardedXcms,
        hasPassedExchange,
        isDestination
      })

      if (!isDestination) {
        hops.push({
          chain: nextChain as TSubstrateChain,
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
        currentAsset = findAssetOnDestOrThrow(
          swapConfig.exchangeChain,
          nextChain,
          swapConfig.currencyTo
        )
      }

      const { forwardedXcms: newXcms, destParaId } = extractNextHopData(hopResult)
      forwardedXcms = newXcms
      nextParaId = destParaId
      currentOrigin = nextChain as TSubstrateChain
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

export const addEthereumBridgeFees = async <TApi, TRes, TResult extends { fee?: bigint }>(
  api: IPolkadotApi<TApi, TRes>,
  bridgeHubResult: TResult | undefined,
  destination: TChain,
  assetHubChain: TSubstrateChain
): Promise<TResult | undefined> => {
  if (!bridgeHubResult || !('fee' in bridgeHubResult) || destination !== 'Ethereum') {
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
