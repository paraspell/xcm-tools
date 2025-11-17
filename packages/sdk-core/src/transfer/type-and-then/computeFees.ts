import {
  hasDryRunSupport,
  isAssetEqual,
  type TCurrencyCore,
  type WithAmount
} from '@paraspell/assets'

import type {
  TGetXcmFeeResult,
  TTxFactory,
  TTypeAndThenCallContext,
  TTypeAndThenFees
} from '../../types'
import { assertAddressIsString, assertSenderAddress, padValueBy } from '../../utils'
import { getXcmFeeInternal } from '../fees'

export const FEE_PADDING = 30

const sumHopFees = <TApi, TRes>(
  result: TGetXcmFeeResult<false>,
  { assetInfo, isRelayAsset, systemAsset }: TTypeAndThenCallContext<TApi, TRes>
): bigint => {
  return result.hops.reduce((acc, hop) => {
    // only add if asset is equal
    return isAssetEqual(hop.result.asset, isRelayAsset ? assetInfo : systemAsset)
      ? acc + hop.result.fee
      : acc
  }, 0n)
}

export const computeAllFees = async <TApi, TRes>(
  context: TTypeAndThenCallContext<TApi, TRes>,
  buildTx: TTxFactory<TRes>
): Promise<TTypeAndThenFees | null> => {
  const {
    origin,
    dest,
    options: { senderAddress, address, currency, feeCurrency }
  } = context

  assertSenderAddress(senderAddress)
  assertAddressIsString(address)

  if (!hasDryRunSupport(context.origin.chain)) {
    return null
  }

  const result = await getXcmFeeInternal({
    api: origin.api,
    buildTx,
    origin: origin.chain,
    destination: dest.chain,
    senderAddress,
    address,
    currency: currency as WithAmount<TCurrencyCore>,
    feeAsset: feeCurrency,
    disableFallback: false,
    skipReverseFeeCalculation: true
  })

  const hopFees = sumHopFees(result, context)
  const destFee = result.destination.fee

  return {
    hopFees: padValueBy(hopFees, FEE_PADDING),
    destFee: padValueBy(destFee, FEE_PADDING)
  }
}
