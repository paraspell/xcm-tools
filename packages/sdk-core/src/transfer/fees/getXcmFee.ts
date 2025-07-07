/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  findAssetForNodeOrThrow,
  findAssetOnDestOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import type { TEcosystemType } from '@paraspell/sdk-common'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type {
  TFeeType,
  TGetXcmFeeOptions,
  TGetXcmFeeResult,
  THubKey,
  TXcmFeeChain,
  TXcmFeeDetail,
  TXcmFeeHopInfo
} from '../../types'
import { getRelayChainOf } from '../../utils'
import { getParaEthTransferFees } from '../ethTransfer'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFee } from './getOriginXcmFee'

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

export const getXcmFee = async <TApi, TRes>({
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
}: TGetXcmFeeOptions<TApi, TRes>): Promise<TGetXcmFeeResult> => {
  const asset = findAssetForNodeOrThrow(origin, currency, destination)

  // Origin fee = execution fee + delivery fees
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

  // Initialize hops array
  const hops: TXcmFeeHopInfo[] = []

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

      const result: TGetXcmFeeResult = {
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
        hops // Include empty hops array
      }

      const { failureChain, failureReason } = getFailureInfo(
        {
          origin: result.origin,
          destination: result.destination
        },
        hops
      )

      return {
        ...result,
        failureChain,
        failureReason
      }
    } finally {
      destApi.setDisconnectAllowed(true)
      await destApi.disconnect()
    }
  }

  const assetHubNode = `AssetHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
  const bridgeHubNode = `BridgeHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains

  let currentOrigin = origin
  let forwardedXcms: any = initialForwardedXcm
  let nextParaId: number | undefined = initialDestParaId

  let currentAsset =
    origin === swapConfig?.exchangeChain
      ? findAssetForNodeOrThrow(swapConfig.exchangeChain, swapConfig.currencyTo, null)
      : asset

  let hasPassedExchange = origin === swapConfig?.exchangeChain

  const intermediateFees: Partial<Record<THubKey, TXcmFeeDetail>> = {}
  let destinationFee: bigint | undefined = 0n
  let destinationFeeType: TFeeType | undefined =
    destination === 'Ethereum' ? 'noFeeRequired' : 'paymentInfo'
  let destinationDryRunError: string | undefined
  let destinationSufficient: boolean | undefined = undefined

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

    if (nextChain === null) {
      throw new InvalidParameterError(`Unable to find TNode for paraId ${nextParaId}`)
    }

    const hopApi = api.clone()

    try {
      await hopApi.init(nextChain, DRY_RUN_CLIENT_TIMEOUT_MS)

      const hopResult = await getDestXcmFee({
        api: hopApi,
        forwardedXcms,
        origin,
        prevNode: currentOrigin,
        destination: nextChain as TNodeDotKsmWithRelayChains,
        currency,
        address,
        senderAddress,
        asset: currentAsset,
        feeAsset,
        originFee: originFee ?? 0n,
        disableFallback
      })

      let hopCurrency: string
      if (hopResult.feeType === 'dryRun') {
        if (hasPassedExchange && swapConfig && nextChain !== swapConfig.exchangeChain) {
          hopCurrency = findAssetOnDestOrThrow(
            swapConfig.exchangeChain,
            nextChain,
            swapConfig.currencyTo
          ).symbol
        } else if (destination === nextChain) {
          hopCurrency = findAssetOnDestOrThrow(origin, nextChain, currency).symbol
        } else {
          hopCurrency = asset.symbol
        }
      } else {
        hopCurrency = getNativeAssetSymbol(nextChain)
      }

      const hopDetail: TXcmFeeDetail = hopResult.dryRunError
        ? {
            fee: hopResult.fee,
            feeType: hopResult.feeType,
            currency: hopCurrency,
            sufficient: hopResult.sufficient,
            dryRunError: hopResult.dryRunError
          }
        : ({
            fee: hopResult.fee,
            feeType: hopResult.feeType,
            currency: hopCurrency,
            sufficient: hopResult.sufficient
          } as TXcmFeeDetail)

      if (nextChain !== destination) {
        hops.push({
          chain: nextChain,
          result: hopDetail
        })
      }

      if (hopResult.dryRunError) {
        const failingRecord: TXcmFeeDetail = hopDetail

        const hopIsDestination =
          nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))

        if (hopIsDestination) {
          destinationFee = hopResult.fee
          destinationFeeType = hopResult.feeType // paymentInfo
          destinationDryRunError = hopResult.dryRunError
          destinationSufficient = hopResult.sufficient
        } else if (nextChain === assetHubNode) {
          intermediateFees.assetHub = failingRecord
        } else if (nextChain === bridgeHubNode) {
          intermediateFees.bridgeHub = failingRecord
        }

        // We failed before the true destination, use fallback via paymentInfo.
        if (!hopIsDestination) {
          const destApi = api.clone()

          if (destination !== 'Ethereum') {
            await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)
          }

          const destFallback = await getDestXcmFee({
            api: destApi,
            forwardedXcms: undefined,
            origin,
            prevNode: currentOrigin,
            destination,
            currency,
            address,
            asset,
            originFee: originFee ?? 0n,
            senderAddress,
            disableFallback
          })

          destinationFee = destFallback.fee
          destinationFeeType = destFallback.feeType
          destinationSufficient = destFallback.sufficient
        }

        break // stop traversing further hops
      }

      if (nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))) {
        destinationFee = hopResult.fee
        destinationFeeType = hopResult.feeType
        destinationSufficient = hopResult.sufficient
      } else if (nextChain === assetHubNode) {
        intermediateFees.assetHub = hopDetail
      } else if (nextChain === bridgeHubNode) {
        intermediateFees.bridgeHub = hopDetail
      } else {
        // Unconcerned intermediate chain – we ignore its fee
      }

      if (swapConfig && nextChain === swapConfig.exchangeChain) {
        hasPassedExchange = true
        currentAsset = findAssetOnDestOrThrow(
          swapConfig.exchangeChain,
          nextChain,
          swapConfig.currencyTo
        )
      }

      forwardedXcms = hopResult.forwardedXcms
      nextParaId = hopResult.destParaId
      currentOrigin = nextChain as TNodeDotKsmWithRelayChains
    } finally {
      await hopApi.disconnect()
    }
  }

  let processedBridgeHubData = intermediateFees.bridgeHub
  if (
    intermediateFees.bridgeHub &&
    !intermediateFees.bridgeHub.dryRunError &&
    destination === 'Ethereum'
  ) {
    const ahApi = api.clone()
    await ahApi.init(assetHubNode, DRY_RUN_CLIENT_TIMEOUT_MS)
    const [bridgeFee] = await getParaEthTransferFees(ahApi)

    processedBridgeHubData = {
      ...intermediateFees.bridgeHub,
      fee: (intermediateFees.bridgeHub.fee as bigint) + bridgeFee
    }

    const bridgeHubHopIndex = hops.findIndex(hop => hop.chain === bridgeHubNode)
    if (bridgeHubHopIndex !== -1) {
      hops[bridgeHubHopIndex].result = {
        ...hops[bridgeHubHopIndex].result,
        fee: (intermediateFees.bridgeHub.fee as bigint) + bridgeFee
      }
    }
  }

  intermediateFees.bridgeHub = processedBridgeHubData

  let destCurrency: string
  if (destinationFeeType === 'dryRun') {
    if (hasPassedExchange && swapConfig && destination !== swapConfig.exchangeChain) {
      destCurrency = findAssetOnDestOrThrow(
        swapConfig.exchangeChain,
        destination,
        swapConfig.currencyTo
      ).symbol
    } else {
      destCurrency = findAssetOnDestOrThrow(origin, destination, currency).symbol
    }
  } else {
    destCurrency = getNativeAssetSymbol(destination)
  }

  const result: TGetXcmFeeResult = {
    origin: {
      ...(originWeight && { weight: originWeight }),
      ...(originFee && { fee: originFee }),
      ...(originFeeType && { feeType: originFeeType }),
      ...(sufficientOriginFee !== undefined && { sufficient: sufficientOriginFee }),
      currency: originCurrency,
      ...(originDryRunError && { dryRunError: originDryRunError })
    } as TXcmFeeDetail,
    ...intermediateFees,
    destination: {
      ...(destinationFee !== undefined && { fee: destinationFee }),
      ...(destinationFeeType && { feeType: destinationFeeType }),
      sufficient: destinationSufficient,
      currency: destCurrency,
      ...(destinationDryRunError && { dryRunError: destinationDryRunError })
    } as TXcmFeeDetail,
    hops
  }

  const { failureChain, failureReason } = getFailureInfo(
    {
      origin: result.origin,
      assetHub: result.assetHub,
      bridgeHub: result.bridgeHub,
      destination: result.destination
    },
    hops
  )

  return {
    ...result,
    failureChain,
    failureReason
  }
}
