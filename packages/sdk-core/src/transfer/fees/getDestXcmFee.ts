/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { findAssetForNodeOrThrow, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { isRelayChain, Parents, Version } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import { getParaId } from '../../nodes/config'
import type { TDestXcmFeeDetail } from '../../types'
import { type TGetFeeForDestNodeOptions } from '../../types'
import { addXcmVersionHeader } from '../../utils'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination } from './isSufficient'

export const createOriginLocation = (
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeDotKsmWithRelayChains
): TMultiLocation => {
  if (isRelayChain(origin)) return DOT_MULTILOCATION

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
  options: TGetFeeForDestNodeOptions<TApi, TRes>
): Promise<TDestXcmFeeDetail<TDisableFallback>> => {
  const {
    api,
    origin,
    prevNode: hopNode,
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

    const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

    if (originAsset.multiLocation) {
      try {
        return await getReverseTxFee(
          { ...options, destination },
          { multilocation: originAsset.multiLocation }
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
    originLocation: addXcmVersionHeader(createOriginLocation(hopNode, destination), Version.V4),
    xcm: forwardedXcms[1][0],
    node: destination,
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
