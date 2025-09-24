/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { TCurrencyCore } from '@paraspell/assets'
import { findAssetInfoOrThrow, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import type { TChain, TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { isRelayChain, Parents, Version } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { DOT_LOCATION } from '../../constants'
import type { TDestXcmFeeDetail } from '../../types'
import { type TGetFeeForDestChainOptions } from '../../types'
import { addXcmVersionHeader } from '../../utils'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination } from './isSufficient'

export const createOriginLocation = (origin: TSubstrateChain, destination: TChain): TLocation => {
  if (isRelayChain(origin)) return DOT_LOCATION

  return {
    parents: isRelayChain(destination) ? Parents.ZERO : Parents.ONE,
    interior: {
      X1: [
        {
          Parachain: getParaId(origin)
        }
      ]
    }
  }
}

export const getDestXcmFee = async <TApi, TRes, TDisableFallback extends boolean>(
  options: TGetFeeForDestChainOptions<TApi, TRes>
): Promise<TDestXcmFeeDetail<TDisableFallback>> => {
  const {
    api,
    origin,
    prevChain: hopChain,
    destination,
    currency,
    forwardedXcms,
    asset,
    address,
    feeAsset,
    originFee,
    tx,
    disableFallback,
    swapConfig
  } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const calcPaymentInfoFee = async (): Promise<bigint> => {
    if (destination === 'Ethereum') {
      return 0n
    }

    const attempt = async (chain: TChain | TSubstrateChain, curr: TCurrencyCore, amt: bigint) => {
      const assetInfo = findAssetInfoOrThrow(chain, curr, destination)

      if (assetInfo.location) {
        try {
          return await getReverseTxFee(
            { ...options, destination },
            { location: assetInfo.location, amount: amt }
          )
        } catch (err: unknown) {
          if (err instanceof InvalidCurrencyError) {
            return await getReverseTxFee(
              { ...options, destination },
              { symbol: assetInfo.symbol, amount: amt }
            )
          }
          throw err
        }
      }

      return await getReverseTxFee(
        { ...options, destination },
        { symbol: assetInfo.symbol, amount: amt }
      )
    }

    try {
      return await attempt(origin, currency, currency.amount)
    } catch (err: unknown) {
      if (!(err instanceof InvalidCurrencyError) || !swapConfig) {
        throw err
      }

      return await attempt(swapConfig.exchangeChain, swapConfig.currencyTo, swapConfig.amountOut)
    }
  }

  if (!hasDryRunSupport(destination) || !forwardedXcms || destination === 'Ethereum') {
    const fee = await calcPaymentInfoFee()

    const sufficient = await isSufficientDestination(
      api,
      destination,
      address,
      currency.amount,
      asset,
      fee
    )

    return {
      fee,
      feeType: 'paymentInfo',
      sufficient,
      asset,
      currency: asset.symbol
    }
  }

  const dryRunResult = await api.getDryRunXcm({
    originLocation: addXcmVersionHeader(createOriginLocation(hopChain, destination), Version.V4),
    tx,
    xcm: forwardedXcms[1][0],
    chain: destination,
    origin,
    asset,
    originFee,
    feeAsset: resolvedFeeAsset,
    amount: currency.amount < 2n ? 2n : currency.amount
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.failureReason
      } as TDestXcmFeeDetail<TDisableFallback>
    }

    const fee = await calcPaymentInfoFee()

    return {
      fee,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason,
      sufficient: false,
      asset,
      currency: asset.symbol
    }
  }

  const { fee, forwardedXcms: newForwardedXcms, destParaId } = dryRunResult

  return {
    fee: fee,
    feeType: 'dryRun',
    sufficient: true,
    forwardedXcms: newForwardedXcms,
    destParaId,
    asset,
    currency: asset.symbol
  }
}
