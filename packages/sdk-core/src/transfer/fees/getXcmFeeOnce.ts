/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import { type TSubstrateChain } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type {
  HopProcessParams,
  TFeeType,
  TGetXcmFeeInternalOptions,
  TGetXcmFeeResult,
  TXcmFeeChain,
  TXcmFeeDetail,
  TXcmFeeHopInfo,
  TXcmFeeHopResult
} from '../../types'
import { abstractDecimals, getRelayChainOf } from '../../utils'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { addEthereumBridgeFees, traverseXcmHops } from '../dry-run'
import { resolveHopAsset } from '../utils/resolveHopAsset'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

const getFailureInfo = (
  chains: Partial<Record<TXcmFeeChain, TXcmFeeDetail>>,
  hops: TXcmFeeHopInfo[]
): {
  failureChain?: TXcmFeeChain
  failureReason?: string
  failureSubReason?: string
} => {
  // Check standard chains first for backwards compatibility
  if (chains.origin?.dryRunError)
    return {
      failureChain: 'origin',
      failureReason: chains.origin.dryRunError,
      failureSubReason: chains.origin.dryRunSubError
    }
  if (chains.assetHub?.dryRunError)
    return {
      failureChain: 'assetHub',
      failureReason: chains.assetHub.dryRunError,
      failureSubReason: chains.assetHub.dryRunSubError
    }
  if (chains.bridgeHub?.dryRunError)
    return {
      failureChain: 'bridgeHub',
      failureReason: chains.bridgeHub.dryRunError,
      failureSubReason: chains.bridgeHub.dryRunSubError
    }
  if (chains.destination?.dryRunError)
    return {
      failureChain: 'destination',
      failureReason: chains.destination.dryRunError,
      failureSubReason: chains.destination.dryRunSubError
    }

  // Check hops for failures
  for (const hop of hops) {
    if (hop.result.dryRunError) {
      return {
        failureChain: hop.chain as TXcmFeeChain,
        failureReason: hop.result.dryRunError,
        failureSubReason: hop.result.dryRunSubError
      }
    }
  }

  return {}
}

export const getXcmFeeOnce = async <TApi, TRes, TDisableFallback extends boolean>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  address,
  currency,
  feeAsset,
  disableFallback,
  swapConfig,
  useRootOrigin,
  skipReverseFeeCalculation
}: TGetXcmFeeInternalOptions<TApi, TRes, TDisableFallback>): Promise<
  TGetXcmFeeResult<TDisableFallback>
> => {
  const asset = findAssetInfoOrThrow(origin, currency, destination)

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const {
    fee: originFeeRaw,
    asset: originAsset,
    feeType: originFeeType,
    dryRunError: originDryRunError,
    dryRunSubError: originDryRunSubError,
    forwardedXcms: initialForwardedXcm,
    destParaId: initialDestParaId,
    weight: originWeight,
    sufficient: sufficientOriginFee
  } = await getOriginXcmFeeInternal({
    api,
    tx,
    origin,
    destination,
    senderAddress,
    feeAsset,
    currency,
    disableFallback,
    useRootOrigin
  })

  const isMythosToEthereum = origin === 'Mythos' && destination === 'Ethereum'
  const originFee = isMythosToEthereum
    ? (await getMythosOriginFee(api)) + (originFeeRaw ?? 0n)
    : originFeeRaw

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
        prevChain: origin,
        destination,
        currency: {
          ...currency,
          amount
        },
        address,
        asset,
        tx,
        originFee: originFee ?? 0n,
        senderAddress,
        disableFallback,
        swapConfig,
        skipReverseFeeCalculation
      })

      const result = {
        origin: {
          ...(originFee && { fee: originFee }),
          ...(originFeeType && { feeType: originFeeType }),
          sufficient: sufficientOriginFee,
          currency:
            originFeeType === 'paymentInfo' ? getNativeAssetSymbol(origin) : originAsset.symbol,
          asset: originFeeType === 'paymentInfo' ? findNativeAssetInfoOrThrow(origin) : originAsset,
          ...(originDryRunError && { dryRunError: originDryRunError }),
          ...(originDryRunSubError && { dryRunSubError: originDryRunSubError })
        } as TXcmFeeDetail,
        destination: {
          ...(destFeeRes.fee ? { fee: destFeeRes.fee } : { fee: 0n }),
          ...(destFeeRes.feeType && { feeType: destFeeRes.feeType }),
          ...(destFeeRes.sufficient !== undefined && { sufficient: destFeeRes.sufficient }),
          currency: getNativeAssetSymbol(destination),
          asset: findNativeAssetInfoOrThrow(destination)
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

  const processHop = async (params: HopProcessParams<TApi, TRes>): Promise<TXcmFeeHopResult> => {
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

    const hopResult = await getDestXcmFee({
      api: hopApi,
      forwardedXcms,
      origin,
      prevChain: currentOrigin,
      destination: currentChain,
      currency: {
        ...currency,
        amount
      },
      address,
      senderAddress,
      asset: hopAsset,
      feeAsset,
      tx,
      originFee: originFee ?? 0n,
      disableFallback,
      hasPassedExchange,
      swapConfig,
      skipReverseFeeCalculation
    })

    return hopResult
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
  let destAsset: TAssetInfo | undefined
  let destFeeType: TFeeType | undefined =
    destination === 'Ethereum' ? 'noFeeRequired' : 'paymentInfo'
  let destDryRunError: string | undefined
  let destDryRunSubError: string | undefined
  let destSufficient: boolean | undefined = undefined

  if (traversalResult.destination) {
    const destResult = traversalResult.destination
    destFee = destResult.fee
    destFeeType = destResult.feeType
    destDryRunError = destResult.dryRunError
    destDryRunSubError = destResult.dryRunSubError
    destSufficient = destResult.sufficient
    destCurrency = destResult.currency
    destAsset = destResult.asset
  } else if (
    traversalResult.hops.length > 0 &&
    traversalResult.hops[traversalResult.hops.length - 1].result.dryRunError
  ) {
    // We failed before reaching destination, use fallback
    const destApi = api.clone()

    await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)

    const destFallback = await getDestXcmFee({
      api: destApi,
      forwardedXcms: undefined,
      origin,
      prevChain: traversalResult.lastProcessedChain || origin,
      destination,
      currency: {
        ...currency,
        amount
      },
      address,
      asset,
      tx,
      originFee: originFee ?? 0n,
      senderAddress,
      disableFallback,
      swapConfig,
      skipReverseFeeCalculation
    })

    destFee = destFallback.fee
    destFeeType = destFallback.feeType
    destSufficient = destFallback.sufficient
    destCurrency = getNativeAssetSymbol(destination)
    destAsset = findNativeAssetInfoOrThrow(destination)
  } else {
    destFee = 0n
    destFeeType = 'noFeeRequired'
    destSufficient = true
    destCurrency = getNativeAssetSymbol(destination)
    destAsset = findNativeAssetInfoOrThrow(destination)
  }

  // Process Ethereum bridge fees
  const assetHubChain = `AssetHub${getRelayChainOf(origin)}` as TSubstrateChain

  const processedBridgeHub = isMythosToEthereum
    ? traversalResult.bridgeHub
    : await addEthereumBridgeFees(api, traversalResult.bridgeHub, destination, assetHubChain)

  // Update bridge hub fee in hops if needed
  if (
    processedBridgeHub &&
    traversalResult.bridgeHub &&
    processedBridgeHub.fee !== traversalResult.bridgeHub.fee
  ) {
    const bridgeHubChain = `BridgeHub${getRelayChainOf(origin)}` as TSubstrateChain
    const bridgeHubHopIndex = traversalResult.hops.findIndex(hop => hop.chain === bridgeHubChain)
    if (bridgeHubHopIndex !== -1) {
      traversalResult.hops[bridgeHubHopIndex].result = {
        ...traversalResult.hops[bridgeHubHopIndex].result,
        fee: processedBridgeHub.fee
      }
    }
  }

  const convertToFeeDetail = (result: TXcmFeeHopResult): TXcmFeeDetail =>
    ({
      ...(result.fee !== undefined && { fee: result.fee }),
      ...(result.feeType && { feeType: result.feeType }),
      ...(result.sufficient !== undefined && { sufficient: result.sufficient }),
      currency: result.currency,
      asset: result.asset,
      ...(result.dryRunError && { dryRunError: result.dryRunError }),
      ...(result.dryRunSubError && { dryRunSubError: result.dryRunSubError })
    }) as TXcmFeeDetail

  const result: TGetXcmFeeResult = {
    origin: {
      ...(originWeight && { weight: originWeight }),
      ...(originFee && { fee: originFee }),
      ...(originFeeType && { feeType: originFeeType }),
      ...(sufficientOriginFee !== undefined && { sufficient: sufficientOriginFee }),
      currency: originAsset.symbol,
      asset: originAsset,
      ...(originDryRunError && { dryRunError: originDryRunError }),
      ...(originDryRunSubError && { dryRunSubError: originDryRunSubError })
    } as TXcmFeeDetail,
    ...(traversalResult.assetHub && { assetHub: convertToFeeDetail(traversalResult.assetHub) }),
    ...(processedBridgeHub && { bridgeHub: convertToFeeDetail(processedBridgeHub) }),
    destination: {
      ...(destFee !== undefined && { fee: destFee }),
      ...(destFeeType && { feeType: destFeeType }),
      sufficient: destSufficient,
      currency: destCurrency,
      asset: destAsset,
      ...(destDryRunError && { dryRunError: destDryRunError }),
      ...(destDryRunSubError && { dryRunSubError: destDryRunSubError })
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
