/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { findAsset, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { isRelayChain, Parents } from '@paraspell/sdk-common'

import { Builder } from '../../builder'
import { DOT_MULTILOCATION } from '../../constants'
import { getParaId } from '../../nodes/config'
import { addXcmVersionHeader } from '../../pallets/xcmPallet/utils'
import type { TFeeType } from '../../types'
import { type TGetFeeForDestNodeOptions, Version } from '../../types'
import { padFee } from './padFee'

const createOriginLocation = (
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

export const getFeeForDestNode = async <TApi, TRes>({
  api,
  forwardedXcms,
  origin,
  destination,
  address,
  senderAddress,
  currency,
  disableFallback
}: TGetFeeForDestNodeOptions<TApi, TRes>): Promise<{
  fee?: bigint
  feeType?: TFeeType
  forwardedXcms?: any
  destParaId?: number
  dryRunError?: string
}> => {
  const calcPaymentInfoFee = async (): Promise<bigint> => {
    if ('multiasset' in currency) {
      throw new InvalidCurrencyError('Multi-assets are not yet supported for XCM fee calculation.')
    }

    const originAsset = findAsset(origin, currency, destination)
    if (!originAsset) {
      throw new InvalidCurrencyError(`Currency ${JSON.stringify(currency)} not found in ${origin}`)
    }

    const currencyInput = originAsset.multiLocation
      ? { multilocation: originAsset.multiLocation }
      : { symbol: originAsset.symbol }

    const tx = await Builder(api)
      .from(destination)
      .to(origin)
      .address(senderAddress, address)
      .currency({ ...currencyInput, amount: currency.amount })
      .build()

    const rawFee = await api.calculateTransactionFee(tx, address)
    return padFee(rawFee, origin, destination, 'destination')
  }

  if (!hasDryRunSupport(destination) || !forwardedXcms) {
    return {
      fee: await calcPaymentInfoFee(),
      feeType: 'paymentInfo'
    }
  }

  const dryRunResult = await api.getDryRunXcm({
    originLocation: addXcmVersionHeader(createOriginLocation(origin, destination), Version.V4),
    xcm: forwardedXcms[1][0],
    node: destination,
    origin
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
