/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  findAssetForNodeOrThrow,
  findAssetOnDestOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import { type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type {
  HopProcessParams,
  TFeeType,
  TGetXcmFeeOptions,
  TGetXcmFeeResult,
  TXcmFeeChain,
  TXcmFeeDetail,
  TXcmFeeHopInfo
} from '../../types'
import { getRelayChainOf } from '../../utils'
import { addEthereumBridgeFees, traverseXcmHops } from '../dryRun'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFee } from './getOriginXcmFee'

export type XcmFeeHopResult = {
  fee?: bigint
  feeType?: TFeeType
  sufficient?: boolean
  dryRunError?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms?: any
  destParaId?: number
  currency?: string
}

const getFailureInfo = (
  nodes: Partial<Record<TXcmFeeChain, TXcmFeeDetail>>,
  hops: TXcmFeeHopInfo[]
): {
  failureChain?: TXcmFeeChain
  failureReason?: string
} => {
  // Check standard chains first for backwards compatibility
  if (nodes.origin?.dryRunError)
    return { failureChain: 'origin', failureReason: nodes.origin.dryRunError }
  if (nodes.assetHub?.dryRunError)
    return { failureChain: 'assetHub', failureReason: nodes.assetHub.dryRunError }
  if (nodes.bridgeHub?.dryRunError)
    return { failureChain: 'bridgeHub', failureReason: nodes.bridgeHub.dryRunError }
  if (nodes.destination?.dryRunError)
    return { failureChain: 'destination', failureReason: nodes.destination.dryRunError }

  // Check hops for failures
  for (const hop of hops) {
    if (hop.result.dryRunError) {
      return { failureChain: hop.chain as TXcmFeeChain, failureReason: hop.result.dryRunError }
    }
  }

  return {}
}

export const getXcmFee = async <TApi, TRes, TDisableFallback extends boolean>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  address,
  currency,
  feeAsset,
  disableFallback,
  swapConfig
}: TGetXcmFeeOptions<TApi, TRes, TDisableFallback>): Promise<
  TGetXcmFeeResult<TDisableFallback>
> => {
  const asset = findAssetForNodeOrThrow(origin, currency, destination)

  const {
    fee: originFee,
    currency: originCurrency,
    feeType: originFeeType,
    dryRunError: originDryRunError,
    forwardedXcms: initialForwardedXcm,
    destParaId: initialDestParaId,
    weight: originWeight,
    sufficient: sufficientOriginFee
  } = await getOriginXcmFee({
    api,
    tx,
    origin,
    destination,
    senderAddress,
    feeAsset,
    currency,
    disableFallback
  })

  api.setDisconnectAllowed(true)
  await api.disconnect()

  // If origin dry run failed or we only have paymentInfo, handle fallback
  if (originDryRunError || originFeeType === 'paymentInfo') {
    const destApi = api.clone()

    try {
      await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)
      destApi.setDisconnectAllowed(false)

      const destFeeRes = await getDestXcmFee({
        api: destApi,
        forwardedXcms: undefined, // force paymentInfo
        origin,
        prevNode: origin,
        destination,
        currency,
        address,
        asset,
        originFee: originFee ?? 0n,
        senderAddress,
        disableFallback
      })

      const result = {
        origin: {
          ...(originFee && { fee: originFee }),
          ...(originFeeType && { feeType: originFeeType }),
          ...(sufficientOriginFee !== undefined && { sufficient: sufficientOriginFee }),
          currency: originCurrency,
          ...(originDryRunError && { dryRunError: originDryRunError })
        } as TXcmFeeDetail,
        destination: {
          ...(destFeeRes.fee ? { fee: destFeeRes.fee } : { fee: 0n }),
          ...(destFeeRes.feeType && { feeType: destFeeRes.feeType }),
          ...(destFeeRes.sufficient !== undefined && { sufficient: destFeeRes.sufficient }),
          currency: getNativeAssetSymbol(destination)
        } as TXcmFeeDetail,
        hops: []
      }

      const { failureChain, failureReason } = getFailureInfo(
        {
          origin: result.origin,
          destination: result.destination
        },
        []
      )

      return {
        ...result,
        failureChain,
        failureReason
      } as TGetXcmFeeResult<TDisableFallback>
    } finally {
      destApi.setDisconnectAllowed(true)
      await destApi.disconnect()
    }
  }

  const processHop = async (params: HopProcessParams<TApi, TRes>): Promise<XcmFeeHopResult> => {
    const {
      api: hopApi,
      currentChain,
      currentOrigin,
      currentAsset,
      forwardedXcms,
      hasPassedExchange
    } = params

    const hopResult = await getDestXcmFee({
      api: hopApi,
      forwardedXcms,
      origin,
      prevNode: currentOrigin,
      destination: currentChain,
      currency,
      address,
      senderAddress,
      asset: currentAsset,
      feeAsset,
      originFee: originFee ?? 0n,
      disableFallback
    })

    let hopCurrency: string
    if (
      hopResult.feeType === 'dryRun' &&
      !(
        destination === 'Ethereum' &&
        (currentChain.includes('AssetHub') || currentChain.includes('BridgeHub'))
      )
    ) {
      if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
        hopCurrency = findAssetOnDestOrThrow(
          swapConfig.exchangeChain,
          currentChain,
          swapConfig.currencyTo
        ).symbol
      } else if (destination === currentChain) {
        hopCurrency = findAssetOnDestOrThrow(origin, currentChain, currency).symbol
      } else {
        hopCurrency = asset.symbol
      }
    } else {
      hopCurrency = getNativeAssetSymbol(currentChain)
    }

    return {
      ...hopResult,
      currency: hopCurrency
    }
  }

  const traversalResult = await traverseXcmHops({
    api,
    origin,
    destination,
    currency,
    initialForwardedXcms: initialForwardedXcm,
    initialDestParaId,
    swapConfig,
    processHop,
    shouldContinue: hopResult => !hopResult.dryRunError,
    extractNextHopData: hopResult => ({
      forwardedXcms: hopResult.forwardedXcms,
      destParaId: hopResult.destParaId
    })
  })

  // Handle case where we failed before reaching destination
  let destFee: bigint | undefined = 0n
  let destCurrency: string | undefined
  let destFeeType: TFeeType | undefined =
    destination === 'Ethereum' ? 'noFeeRequired' : 'paymentInfo'
  let destDryRunError: string | undefined
  let destSufficient: boolean | undefined = undefined

  if (traversalResult.destination) {
    const destResult = traversalResult.destination
    destFee = destResult.fee
    destFeeType = destResult.feeType
    destDryRunError = destResult.dryRunError
    destSufficient = destResult.sufficient
    destCurrency = destResult.currency
  } else if (
    traversalResult.hops.length > 0 &&
    traversalResult.hops[traversalResult.hops.length - 1].result.dryRunError
  ) {
    // We failed before reaching destination, use fallback
    const destApi = api.clone()

    if (destination !== 'Ethereum') {
      await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)
    }

    const destFallback = await getDestXcmFee({
      api: destApi,
      forwardedXcms: undefined,
      origin,
      prevNode: traversalResult.lastProcessedChain || origin,
      destination,
      currency,
      address,
      asset,
      originFee: originFee ?? 0n,
      senderAddress,
      disableFallback
    })

    destFee = destFallback.fee
    destFeeType = destFallback.feeType
    destSufficient = destFallback.sufficient
    destCurrency = getNativeAssetSymbol(destination)
  } else {
    destFee = 0n
    destFeeType = 'noFeeRequired'
    destSufficient = true
    destCurrency = getNativeAssetSymbol(destination)
  }

  // Process Ethereum bridge fees
  const assetHubNode = `AssetHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
  const processedBridgeHub = await addEthereumBridgeFees(
    api,
    traversalResult.bridgeHub,
    destination,
    assetHubNode
  )

  // Update bridge hub fee in hops if needed
  if (
    processedBridgeHub &&
    traversalResult.bridgeHub &&
    processedBridgeHub.fee !== traversalResult.bridgeHub.fee
  ) {
    const bridgeHubNode = `BridgeHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
    const bridgeHubHopIndex = traversalResult.hops.findIndex(hop => hop.chain === bridgeHubNode)
    if (bridgeHubHopIndex !== -1) {
      traversalResult.hops[bridgeHubHopIndex].result = {
        ...traversalResult.hops[bridgeHubHopIndex].result,
        fee: processedBridgeHub.fee
      }
    }
  }

  const convertToFeeDetail = (result: XcmFeeHopResult): TXcmFeeDetail =>
    ({
      ...(result.fee !== undefined && { fee: result.fee }),
      ...(result.feeType && { feeType: result.feeType }),
      ...(result.sufficient !== undefined && { sufficient: result.sufficient }),
      currency: result.currency,
      ...(result.dryRunError && { dryRunError: result.dryRunError })
    }) as TXcmFeeDetail

  const result: TGetXcmFeeResult = {
    origin: {
      ...(originWeight && { weight: originWeight }),
      ...(originFee && { fee: originFee }),
      ...(originFeeType && { feeType: originFeeType }),
      ...(sufficientOriginFee !== undefined && { sufficient: sufficientOriginFee }),
      currency: originCurrency,
      ...(originDryRunError && { dryRunError: originDryRunError })
    } as TXcmFeeDetail,
    ...(traversalResult.assetHub && { assetHub: convertToFeeDetail(traversalResult.assetHub) }),
    ...(processedBridgeHub && { bridgeHub: convertToFeeDetail(processedBridgeHub) }),
    destination: {
      ...(destFee !== undefined && { fee: destFee }),
      ...(destFeeType && { feeType: destFeeType }),
      sufficient: destSufficient,
      currency: destCurrency,
      ...(destDryRunError && { dryRunError: destDryRunError })
    } as TXcmFeeDetail,
    hops: traversalResult.hops.map(hop => ({
      chain: hop.chain,
      result: convertToFeeDetail(hop.result)
    }))
  }

  const { failureChain, failureReason } = getFailureInfo(
    {
      origin: result.origin,
      assetHub: result.assetHub,
      bridgeHub: result.bridgeHub,
      destination: result.destination
    },
    result.hops
  )

  return {
    ...result,
    failureChain,
    failureReason
  } as TGetXcmFeeResult<TDisableFallback>
}
