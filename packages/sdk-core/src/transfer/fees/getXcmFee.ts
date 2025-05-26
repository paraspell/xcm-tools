/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { findAssetForNodeOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type {
  TFeeType,
  TGetXcmFeeOptions,
  TGetXcmFeeResult,
  THubKey,
  TXcmFeeDetail
} from '../../types'
import { determineRelayChain } from '../../utils'
import { getParaEthTransferFees } from '../ethTransfer'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFee } from './getOriginXcmFee'

export const getXcmFee = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  address,
  currency,
  feeAsset,
  disableFallback
}: TGetXcmFeeOptions<TApi, TRes>): Promise<TGetXcmFeeResult> => {
  const asset = findAssetForNodeOrThrow(origin, currency, destination)

  // Origin fee = execution fee + delivery fees
  const {
    fee: originFee,
    currency: originCurrency,
    feeType: originFeeType,
    dryRunError: originDryRunError,
    forwardedXcms: initialForwardedXcm,
    destParaId: initialDestParaId
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

  if (originDryRunError || originFeeType === 'paymentInfo') {
    const destApi = api.clone()

    try {
      if (destination !== 'Ethereum') {
        await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)
      }
      destApi.setDisconnectAllowed(false)

      const destFeeRes = await getDestXcmFee({
        api: destApi,
        forwardedXcms: undefined, // force paymentInfo
        origin,
        hopNode: origin,
        destination,
        currency,
        address,
        asset,
        originFee: originFee ?? 0n,
        senderAddress,
        disableFallback
      })

      return {
        origin: {
          ...(originFee && { fee: originFee }),
          ...(originFeeType && { feeType: originFeeType }),
          currency: originCurrency,
          ...(originDryRunError && { dryRunError: originDryRunError })
        } as TXcmFeeDetail,
        destination: {
          ...(destFeeRes.fee ? { fee: destFeeRes.fee } : { fee: 0n }),
          ...(destFeeRes.feeType && { feeType: destFeeRes.feeType }),
          currency: getNativeAssetSymbol(destination)
        } as TXcmFeeDetail
      }
    } finally {
      destApi.setDisconnectAllowed(true)
      await destApi.disconnect()
    }
  }

  const assetHubNode =
    determineRelayChain(origin) === 'Polkadot' ? 'AssetHubPolkadot' : 'AssetHubKusama'
  const bridgeHubNode =
    determineRelayChain(origin) === 'Polkadot' ? 'BridgeHubPolkadot' : 'BridgeHubKusama'

  let currentOrigin = origin
  let forwardedXcms: any = initialForwardedXcm
  let nextParaId: number | undefined = initialDestParaId

  const intermediateFees: Partial<Record<THubKey, TXcmFeeDetail>> = {}
  let destinationFee: bigint | undefined = 0n
  let destinationFeeType: TFeeType | undefined =
    destination === 'Ethereum' ? 'noFeeRequired' : 'paymentInfo'
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
      throw new InvalidParameterError(`Unable to find TNode for paraId ${nextParaId}`)
    }

    const hopApi = api.clone()

    try {
      await hopApi.init(nextChain, DRY_RUN_CLIENT_TIMEOUT_MS)

      const hopResult = await getDestXcmFee({
        api: hopApi,
        forwardedXcms,
        origin,
        hopNode: currentOrigin,
        destination: nextChain as TNodeDotKsmWithRelayChains,
        currency,
        address,
        senderAddress,
        asset,
        feeAsset,
        originFee: originFee ?? 0n,
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
        } else if (nextChain === assetHubNode) {
          intermediateFees.assetHub = failingRecord
        } else if (nextChain === bridgeHubNode) {
          intermediateFees.bridgeHub = failingRecord
        }

        // We failed before the true destination, use fallback via paymentInfo.
        if (!hopIsDestination) {
          const destFallback = await getDestXcmFee({
            api: hopApi,
            forwardedXcms: undefined,
            origin,
            hopNode: currentOrigin,
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
        }

        break // stop traversing further hops
      }

      if (nextChain === destination || (isRelayChain(nextChain) && !isRelayChain(destination))) {
        destinationFee = hopResult.fee
        destinationFeeType = hopResult.feeType
      } else if (nextChain === assetHubNode) {
        intermediateFees.assetHub = {
          fee: hopResult.fee,
          feeType: hopResult.feeType,
          currency: getNativeAssetSymbol(nextChain)
        } as TXcmFeeDetail
      } else if (nextChain === bridgeHubNode) {
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
  }

  intermediateFees.bridgeHub = processedBridgeHubData

  return {
    origin: {
      ...(originFee && { fee: originFee }),
      ...(originFeeType && { feeType: originFeeType }),
      currency: originCurrency,
      ...(originDryRunError && { dryRunError: originDryRunError })
    } as TXcmFeeDetail,
    ...intermediateFees,
    destination: {
      ...(destinationFee !== undefined && { fee: destinationFee }),
      ...(destinationFeeType && { feeType: destinationFeeType }),
      currency: destinationFeeType === 'dryRun' ? asset.symbol : getNativeAssetSymbol(destination),
      ...(destinationDryRunError && { dryRunError: destinationDryRunError })
    } as TXcmFeeDetail
  }
}
