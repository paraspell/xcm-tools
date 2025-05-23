/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { findAssetForNodeOrThrow, getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import { addXcmVersionHeader } from '../../pallets/xcmPallet/utils'
import type { TDryRunNodeResultInternal } from '../../types'
import { type TDryRunOptions, type TDryRunResult, type THubKey, Version } from '../../types'
import { determineRelayChain } from '../../utils'
import { createOriginLocation } from '../fees/getDestXcmFee'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'

export const dryRunInternal = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { origin, destination, currency, api, tx, senderAddress, feeAsset } = options

  const resolvedFeeAsset =
    feeAsset && origin === 'AssetHubPolkadot'
      ? resolveFeeAsset(feeAsset, origin, destination, currency)
      : undefined

  const asset = findAssetForNodeOrThrow(origin, currency, destination)

  const originDryRun = await api.getDryRunCall({
    tx,
    node: origin,
    address: senderAddress,
    isFeeAsset: !!resolvedFeeAsset
  })

  if (!originDryRun.success) {
    return {
      origin: originDryRun
    }
  }

  const { forwardedXcms: initialForwardedXcms, destParaId: initialDestParaId } = originDryRun

  let currentOrigin = origin
  let forwardedXcms: any = initialForwardedXcms
  let nextParaId: number | undefined = initialDestParaId

  const intermediateFees: Partial<Record<THubKey, TDryRunNodeResultInternal>> = {}
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

      if (nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))) {
        destinationDryRun = hopDryRun
      } else if (nextChain === 'AssetHubPolkadot') {
        intermediateFees.assetHub = hopDryRun
      } else if (nextChain === 'BridgeHubPolkadot') {
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

  return {
    origin: originDryRun.success
      ? {
          ...originDryRun,
          currency: resolvedFeeAsset ? resolvedFeeAsset.symbol : getNativeAssetSymbol(origin)
        }
      : originDryRun,
    assetHub: intermediateFees.assetHub?.success
      ? { ...intermediateFees.assetHub, currency: getNativeAssetSymbol('AssetHubPolkadot') }
      : intermediateFees.assetHub,
    bridgeHub: intermediateFees.bridgeHub?.success
      ? { ...intermediateFees.bridgeHub, currency: getNativeAssetSymbol('BridgeHubPolkadot') }
      : intermediateFees.bridgeHub,
    destination: destinationDryRun?.success
      ? { ...destinationDryRun, currency: asset.symbol }
      : destinationDryRun
  }
}
