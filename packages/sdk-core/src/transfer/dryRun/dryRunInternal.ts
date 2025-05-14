/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  findAsset,
  getNativeAssetSymbol,
  hasDryRunSupport,
  InvalidCurrencyError
} from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { getTNode } from '../../nodes/getTNode'
import { addXcmVersionHeader } from '../../pallets/xcmPallet/utils'
import type { TDryRunNodeResultInternal } from '../../types'
import { type TDryRunOptions, type TDryRunResult, type THubKey, Version } from '../../types'
import { determineRelayChain } from '../../utils'
import { createOriginLocation } from '../fees/getFeeForDestNode'

export const dryRunInternal = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { origin, destination, currency, api, tx, senderAddress } = options

  const asset =
    findAsset(origin, currency, destination) ??
    (origin === 'AssetHubPolkadot' ? findAsset('Ethereum', currency, null) : null)

  if (!asset)
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${origin}`)

  const originDryRun = await api.getDryRunCall({
    tx,
    node: origin,
    address: senderAddress
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

    if (!nextChain) throw new Error(`Unable to find TNode for paraId ${nextParaId}`)

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
        origin: currentOrigin
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
      ? { ...originDryRun, currency: getNativeAssetSymbol(origin) }
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
