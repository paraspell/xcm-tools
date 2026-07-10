/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TChain, TLocation, TSubstrateChain, Version } from '@paraspell/sdk-common'
import { isExternalChain, isRelayChain, Parents } from '@paraspell/sdk-common'

import { getParaIdImpl } from '../../chains/config'
import { DOT_LOCATION } from '../../constants'
import type { TFullCustomCtx, TXcmFeeDetailWithForwardedXcm } from '../../types'
import { type TGetFeeForDestChainOptions } from '../../types'
import { addXcmVersionHeader, createX1Payload, normalizeAmount } from '../../utils'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination } from './isSufficient'

export const createOriginLocation = <TCustomChain extends string = never>(
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  version: Version,
  customCtx?: TFullCustomCtx
): TLocation => {
  if (isRelayChain(origin)) return DOT_LOCATION

  return {
    parents: isRelayChain(destination) ? Parents.ZERO : Parents.ONE,
    interior: createX1Payload(version, {
      Parachain: getParaIdImpl(origin, customCtx)
    })
  }
}

export const getDestXcmFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean,
  TCustomChain extends string = never
>(
  options: TGetFeeForDestChainOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> => {
  const {
    api,
    origin,
    prevChain: hopChain,
    destination,
    currency,
    asset,
    currentAsset,
    forwardedXcms,
    recipient,
    feeAsset,
    originFee,
    tx,
    version,
    disableFallback,
    swapConfig
  } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, origin, destination, currency)
    : undefined

  const calcPaymentInfoFee = async (): Promise<bigint> => {
    if (isExternalChain(destination)) {
      return 0n
    }

    const reverseFeeFor = async (assetInfo: TAssetInfo, amount: bigint) => {
      try {
        return await getReverseTxFee(
          { ...options, destination },
          { location: assetInfo.location, amount }
        )
      } catch (err: unknown) {
        if (err instanceof InvalidCurrencyError) {
          return await getReverseTxFee(
            { ...options, destination },
            { symbol: assetInfo.symbol, amount }
          )
        }
        throw err
      }
    }

    try {
      return await reverseFeeFor(asset, asset.amount)
    } catch (err: unknown) {
      if (!(err instanceof InvalidCurrencyError) || !swapConfig) {
        return 0n
      }

      const swapAsset = api.findAssetInfoOrThrow(
        swapConfig.exchangeChain,
        swapConfig.currencyTo,
        destination
      )
      return await reverseFeeFor(swapAsset, swapConfig.amountOut)
    }
  }

  if (!api.hasDryRunSupport(destination) || !forwardedXcms || isExternalChain(destination)) {
    const fee = await calcPaymentInfoFee()

    const sufficient = await isSufficientDestination(api, destination, recipient, currentAsset, fee)

    return {
      fee,
      feeType: 'paymentInfo',
      sufficient,
      asset: currentAsset
    }
  }

  const dryRunResult = await api.getDryRunXcm({
    originLocation: addXcmVersionHeader(
      createOriginLocation(hopChain, destination, version),
      version
    ),
    tx,
    xcm: forwardedXcms[1][0],
    chain: destination,
    origin,
    asset: currentAsset,
    version,
    originFee,
    feeAsset: resolvedFeeAsset,
    amount: normalizeAmount(currentAsset.amount)
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.dryRunError
      } as TXcmFeeDetailWithForwardedXcm<TDisableFallback>
    }

    const fee = await calcPaymentInfoFee()

    return {
      fee,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.dryRunError,
      sufficient: false,
      asset: currentAsset
    }
  }

  const { fee, forwardedXcms: newForwardedXcms, destParaId } = dryRunResult

  return {
    fee: fee,
    feeType: 'dryRun',
    sufficient: true,
    forwardedXcms: newForwardedXcms,
    destParaId,
    asset: currentAsset
  }
}
