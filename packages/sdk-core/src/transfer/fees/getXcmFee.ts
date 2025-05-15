/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { findAsset, getNativeAssetSymbol, InvalidCurrencyError } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { getTNode } from '../../nodes/getTNode'
import type {
  TFeeType,
  TGetXcmFeeOptions,
  TGetXcmFeeResult,
  THubKey,
  TXcmFeeDetail
} from '../../types'
import { determineRelayChain } from '../../utils'
import { getFeeForDestNode } from './getFeeForDestNode'
import { getFeeForOriginNode } from './getFeeForOriginNode'

export const getXcmFee = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  address,
  currency,
  disableFallback
}: TGetXcmFeeOptions<TApi, TRes>): Promise<TGetXcmFeeResult> => {
  const asset =
    findAsset(origin, currency, destination) ??
    (origin === 'AssetHubPolkadot' ? findAsset('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${origin}`)
  }

  // Origin fee = execution fee + delivery fees
  const {
    fee: originFee,
    feeType: originFeeType,
    dryRunError: originDryRunError,
    forwardedXcms: initialForwardedXcm,
    destParaId: initialDestParaId
  } = await getFeeForOriginNode({
    api,
    tx,
    origin,
    destination,
    senderAddress,
    disableFallback
  })

  api.setDisconnectAllowed(true)
  await api.disconnect()

  if (originDryRunError || originFeeType === 'paymentInfo') {
    const destApi = api.clone()

    try {
      await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)
      destApi.setDisconnectAllowed(false)

      const destFeeRes = await getFeeForDestNode({
        api: destApi,
        forwardedXcms: undefined, // force paymentInfo
        origin,
        destination,
        currency,
        address,
        senderAddress,
        disableFallback
      })

      return {
        origin: {
          ...(originFee && { fee: originFee }),
          ...(originFeeType && { feeType: originFeeType }),
          currency: getNativeAssetSymbol(origin),
          ...(originDryRunError && { dryRunError: originDryRunError })
        } as TXcmFeeDetail,
        destination: {
          ...(destFeeRes.fee && { fee: destFeeRes.fee }),
          ...(destFeeRes.feeType && { feeType: destFeeRes.feeType }),
          currency: getNativeAssetSymbol(destination)
        } as TXcmFeeDetail
      }
    } finally {
      destApi.setDisconnectAllowed(true)
      await destApi.disconnect()
    }
  }

  let currentOrigin = origin
  let forwardedXcms: any = initialForwardedXcm
  let nextParaId: number | undefined = initialDestParaId

  const intermediateFees: Partial<Record<THubKey, TXcmFeeDetail>> = {}
  let destinationFee: bigint | undefined = 0n
  let destinationFeeType: TFeeType | undefined = 'paymentInfo'
  let destinationDryRunError: string | undefined

  while (
    Array.isArray(forwardedXcms) &&
    forwardedXcms.length > 0 &&
    forwardedXcms[1].length > 0 &&
    ('disconnect' in (api.getApi() as object)
      ? Object.values(forwardedXcms[1][0]).length
      : forwardedXcms[1][0].value.length) > 0 &&
    nextParaId !== undefined
  ) {
    const nextChain = getTNode(
      nextParaId,
      determineRelayChain(origin) === 'Polkadot' ? 'polkadot' : 'kusama'
    )

    if (nextChain === null) {
      throw new Error(`Unable to find TNode for paraId ${nextParaId}`)
    }

    const hopApi = api.clone()

    try {
      await hopApi.init(nextChain, DRY_RUN_CLIENT_TIMEOUT_MS)

      const hopResult = await getFeeForDestNode({
        api: hopApi,
        forwardedXcms,
        origin: currentOrigin,
        destination: nextChain as TNodeDotKsmWithRelayChains,
        currency,
        address,
        senderAddress,
        disableFallback
      })

      if (hopResult.dryRunError) {
        const failingRecord: TXcmFeeDetail = {
          fee: hopResult.fee,
          feeType: hopResult.feeType,
          currency: getNativeAssetSymbol(nextChain),
          dryRunError: hopResult.dryRunError
        }

        const hopIsDestination =
          nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))

        if (hopIsDestination) {
          destinationFee = hopResult.fee
          destinationFeeType = hopResult.feeType // paymentInfo
          destinationDryRunError = hopResult.dryRunError
        } else if (nextChain === 'AssetHubPolkadot') {
          intermediateFees.assetHub = failingRecord
        } else if (nextChain === 'BridgeHubPolkadot') {
          intermediateFees.bridgeHub = failingRecord
        }

        // We failed before the true destination, use fallback via paymentInfo.
        if (!hopIsDestination) {
          const destFallback = await getFeeForDestNode({
            api: hopApi,
            forwardedXcms: undefined,
            origin: nextChain as TNodeDotKsmWithRelayChains,
            destination,
            currency,
            address,
            senderAddress,
            disableFallback
          })

          destinationFee = destFallback.fee
          destinationFeeType = destFallback.feeType
        }

        break // stop traversing further hops
      }

      if (nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))) {
        destinationFee = hopResult.fee
        destinationFeeType = hopResult.feeType
      } else if (nextChain === 'AssetHubPolkadot') {
        intermediateFees.assetHub = {
          fee: hopResult.fee,
          feeType: hopResult.feeType,
          currency: getNativeAssetSymbol(nextChain)
        } as TXcmFeeDetail
      } else if (nextChain === 'BridgeHubPolkadot') {
        intermediateFees.bridgeHub = {
          fee: hopResult.fee,
          feeType: hopResult.feeType,
          currency: getNativeAssetSymbol(nextChain)
        } as TXcmFeeDetail
      } else {
        // Unconcerned intermediate chain – we ignore its fee
      }

      forwardedXcms = hopResult.forwardedXcms
      nextParaId = hopResult.destParaId
      currentOrigin = nextChain as TNodeDotKsmWithRelayChains
    } finally {
      await hopApi.disconnect()
    }
  }

  return {
    origin: {
      ...(originFee && { fee: originFee }),
      ...(originFeeType && { feeType: originFeeType }),
      currency: getNativeAssetSymbol(origin),
      ...(originDryRunError && { dryRunError: originDryRunError })
    } as TXcmFeeDetail,
    ...intermediateFees,
    destination: {
      ...(destinationFee && { fee: destinationFee }),
      ...(destinationFeeType && { feeType: destinationFeeType }),
      currency: destinationFeeType === 'dryRun' ? asset.symbol : getNativeAssetSymbol(destination),
      ...(destinationDryRunError && { dryRunError: destinationDryRunError })
    } as TXcmFeeDetail
  }
}
