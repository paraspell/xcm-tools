/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { findAssetForNodeOrThrow, getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains, Version } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type { TDryRunChain, TDryRunNodeResultInternal, THopInfo } from '../../types'
import { type TDryRunOptions, type TDryRunResult, type THubKey } from '../../types'
import { addXcmVersionHeader, determineRelayChain } from '../../utils'
import { getParaEthTransferFees } from '../ethTransfer'
import { createOriginLocation } from '../fees/getDestXcmFee'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'

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
  const { origin, destination, currency, api, tx, senderAddress, feeAsset } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const asset = findAssetForNodeOrThrow(origin, currency, destination)

  const originDryRun = await api.getDryRunCall({
    tx,
    node: origin,
    address: senderAddress,
    asset,
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

  const assetHubNode =
    determineRelayChain(origin) === 'Polkadot' ? 'AssetHubPolkadot' : 'AssetHubKusama'
  const bridgeHubNode =
    determineRelayChain(origin) === 'Polkadot' ? 'BridgeHubPolkadot' : 'BridgeHubKusama'

  let currentOrigin = origin
  let forwardedXcms: any = initialForwardedXcms
  let nextParaId: number | undefined = initialDestParaId

  const intermediateFees: Partial<Record<THubKey, TDryRunNodeResultInternal>> = {}
  const hops: THopInfo[] = []
  let destinationDryRun: TDryRunNodeResultInternal | undefined

  while (
    Array.isArray(forwardedXcms) &&
    forwardedXcms.length &&
    forwardedXcms[1].length &&
    ('disconnect' in (api.getApi() as object)
      ? Object.values(forwardedXcms[1][0]).length
      : forwardedXcms[1][0].value.length) > 0 &&
    nextParaId !== undefined
  ) {
    const nextChain = getTNode(
      nextParaId,
      determineRelayChain(origin) === 'Polkadot' ? 'polkadot' : 'kusama'
    )

    if (!nextChain) throw new InvalidParameterError(`Unable to find TNode for paraId ${nextParaId}`)

    const hopApi = api.clone()

    try {
      if (!hasDryRunSupport(nextChain)) {
        if (nextChain === destination) {
          destinationDryRun = {
            success: false,
            failureReason: `DryRunApi is not available on node ${nextChain}`
          }
        }
        break
      }

      await hopApi.init(nextChain, DRY_RUN_CLIENT_TIMEOUT_MS)

      const hopDryRun = await hopApi.getDryRunXcm({
        originLocation: addXcmVersionHeader(
          createOriginLocation(currentOrigin, nextChain as TNodeDotKsmWithRelayChains),
          Version.V4
        ),
        xcm: forwardedXcms[1][0],
        node: nextChain as TNodeDotKsmWithRelayChains,
        origin: currentOrigin,
        asset,
        feeAsset: resolvedFeeAsset,
        originFee: originDryRun.fee,
        amount: BigInt((currency as WithAmount<TCurrencyCore>).amount)
      })

      // Determine the currency for this hop
      let hopCurrency: string | undefined
      if (nextChain === destination) {
        hopCurrency = asset?.symbol
      } else if (
        isRelayChain(nextChain) ||
        nextChain === assetHubNode ||
        nextChain === bridgeHubNode
      ) {
        hopCurrency = resolvedFeeAsset
          ? resolvedFeeAsset.symbol
          : getNativeAssetSymbol(nextChain as TNodeDotKsmWithRelayChains)
      }

      // Add to hops array (only if not the destination)
      if (nextChain !== destination) {
        hops.push({
          chain: nextChain,
          result:
            hopDryRun.success && hopCurrency ? { ...hopDryRun, currency: hopCurrency } : hopDryRun
        })
      }

      // Keep existing logic for backwards compatibility
      if (nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))) {
        destinationDryRun = hopDryRun
      } else if (nextChain === assetHubNode) {
        intermediateFees.assetHub = hopDryRun
      } else if (nextChain === bridgeHubNode) {
        intermediateFees.bridgeHub = hopDryRun
      }

      if (!hopDryRun.success) {
        break
      }

      const { forwardedXcms: newXcms, destParaId } = hopDryRun

      forwardedXcms = newXcms
      nextParaId = destParaId
      currentOrigin = nextChain as TNodeDotKsmWithRelayChains
    } finally {
      await hopApi.disconnect()
    }
  }

  let processedBridgeHubData = intermediateFees.bridgeHub
  if (intermediateFees.bridgeHub?.success && destination === 'Ethereum') {
    const ahApi = api.clone()
    await ahApi.init(assetHubNode, DRY_RUN_CLIENT_TIMEOUT_MS)
    const [bridgeFee] = await getParaEthTransferFees(ahApi)
    processedBridgeHubData = {
      ...intermediateFees.bridgeHub,
      fee: intermediateFees.bridgeHub.fee + bridgeFee
    }

    // Update the hop data if BridgeHub is in the hops array
    const bridgeHubHopIndex = hops.findIndex(hop => hop.chain === bridgeHubNode)
    if (bridgeHubHopIndex !== -1 && hops[bridgeHubHopIndex].result.success) {
      hops[bridgeHubHopIndex].result = {
        ...hops[bridgeHubHopIndex].result,
        fee: intermediateFees.bridgeHub.fee + bridgeFee
      }
    }
  }

  const { failureReason, failureChain } = getFailureInfo(
    {
      destination: destinationDryRun,
      assetHub: intermediateFees.assetHub,
      bridgeHub: intermediateFees.bridgeHub
    },
    hops
  )

  return {
    failureReason,
    failureChain,
    origin: originDryRun.success
      ? {
          ...originDryRun,
          currency: resolvedFeeAsset ? resolvedFeeAsset.symbol : getNativeAssetSymbol(origin)
        }
      : originDryRun,
    assetHub: intermediateFees.assetHub?.success
      ? {
          ...intermediateFees.assetHub,
          currency: resolvedFeeAsset ? resolvedFeeAsset.symbol : getNativeAssetSymbol(assetHubNode)
        }
      : intermediateFees.assetHub,
    bridgeHub: processedBridgeHubData?.success
      ? { ...processedBridgeHubData, currency: getNativeAssetSymbol(bridgeHubNode) }
      : processedBridgeHubData,
    destination: destinationDryRun?.success
      ? { ...destinationDryRun, currency: asset?.symbol }
      : destinationDryRun,
    hops // Add the hops array to the return value
  }
}
