/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { findAsset, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { isRelayChain, Parents } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import { getParaId } from '../../nodes/config'
import { addXcmVersionHeader } from '../../pallets/xcmPallet/utils'
import type { TFeeType } from '../../types'
import { type TGetFeeForDestNodeOptions, Version } from '../../types'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { getReverseTxFee } from './getReverseTxFee'

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

export const getDestXcmFee = async <TApi, TRes>(
  options: TGetFeeForDestNodeOptions<TApi, TRes>
): Promise<{
  fee?: bigint
  feeType?: TFeeType
  forwardedXcms?: any
  destParaId?: number
  dryRunError?: string
}> => {
  const {
    api,
    origin,
    destination,
    currency,
    forwardedXcms,
    asset,
    feeAsset,
    originFee,
    disableFallback
  } = options

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const calcPaymentInfoFee = async (): Promise<bigint> => {
    if (destination === 'Ethereum') return 0n

    const originAsset = findAsset(origin, currency, destination)
    if (!originAsset) {
      throw new InvalidCurrencyError(`Currency ${JSON.stringify(currency)} not found in ${origin}`)
    }

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
    return {
      fee: await calcPaymentInfoFee(),
      feeType: 'paymentInfo'
    }
  }

  const dryRunResult = await api.getDryRunXcm({
    originLocation: addXcmVersionHeader(createOriginLocation(origin, destination), Version.V4),
    xcm: forwardedXcms[1][0],
    node: destination,
    origin,
    asset,
    originFee,
    feeAsset: resolvedFeeAsset,
    amount: BigInt((currency as WithAmount<TCurrencyCore>).amount)
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.failureReason
      }
    }

    return {
      fee: await calcPaymentInfoFee(),
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason
    }
  }

  const { fee, forwardedXcms: newForwardedXcms, destParaId } = dryRunResult

  return { fee: fee, feeType: 'dryRun', forwardedXcms: newForwardedXcms, destParaId }
}
