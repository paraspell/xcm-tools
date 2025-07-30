/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    disableFallback
  } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const calcPaymentInfoFee = async (): Promise<bigint> => {
    if (destination === 'Ethereum') return 0n

    const originAsset = findAssetInfoOrThrow(origin, currency, destination)

    if (originAsset.location) {
      try {
        return await getReverseTxFee(
          { ...options, destination },
          { location: originAsset.location }
        )
      } catch (err: any) {
        if (err instanceof InvalidCurrencyError) {
          return await getReverseTxFee({ ...options, destination }, { symbol: originAsset.symbol })
        }
        throw err
      }
    }

    return await getReverseTxFee({ ...options, destination }, { symbol: originAsset.symbol })
  }

  if (!hasDryRunSupport(destination) || !forwardedXcms || destination === 'Ethereum') {
    const fee = await calcPaymentInfoFee()

    const sufficient = await isSufficientDestination(
      api,
      destination,
      address,
      BigInt(currency.amount),
      asset,
      fee
    )

    return {
      fee,
      feeType: 'paymentInfo',
      sufficient
    } as TDestXcmFeeDetail<TDisableFallback>
  }

  const dryRunResult = await api.getDryRunXcm({
    originLocation: addXcmVersionHeader(createOriginLocation(hopChain, destination), Version.V4),
    xcm: forwardedXcms[1][0],
    chain: destination,
    origin,
    asset,
    originFee,
    feeAsset: resolvedFeeAsset,
    amount: BigInt(currency.amount) < 2n ? 2n : BigInt(currency.amount)
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.failureReason
      } as TDestXcmFeeDetail<false>
    }

    const fee = await calcPaymentInfoFee()

    const sufficient = await isSufficientDestination(
      api,
      destination,
      address,
      BigInt(currency.amount),
      asset,
      fee
    )

    return {
      fee,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason,
      sufficient
    } as TDestXcmFeeDetail<TDisableFallback>
  }

  const { fee, forwardedXcms: newForwardedXcms, destParaId } = dryRunResult

  return {
    fee: fee,
    feeType: 'dryRun',
    sufficient: true,
    forwardedXcms: newForwardedXcms,
    destParaId
  } as TDestXcmFeeDetail<TDisableFallback>
}
