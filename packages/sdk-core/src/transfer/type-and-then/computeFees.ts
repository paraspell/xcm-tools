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
import { assertAddressIsString, assertSender, padValueBy } from '../../utils'
import { getXcmFeeInternal } from '../fees'

export const FEE_PADDING = 30

const sumHopFees = <TApi, TRes, TSigner>(
  result: TGetXcmFeeResult<false>,
  { assetInfo, isRelayAsset, systemAsset }: TTypeAndThenCallContext<TApi, TRes, TSigner>
): bigint => {
  return result.hops.reduce((acc, hop) => {
    // only add if asset is equal
    return isAssetEqual(hop.result.asset, isRelayAsset ? assetInfo : systemAsset)
      ? acc + hop.result.fee
      : acc
  }, 0n)
}

export const computeAllFees = async <TApi, TRes, TSigner>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner>,
  buildTx: TTxFactory<TRes>
): Promise<TTypeAndThenFees | null> => {
  const {
    origin,
    dest,
    options: { sender, recipient, currency, feeCurrency, version }
  } = context

  assertSender(sender)
  assertAddressIsString(recipient)

  if (!hasDryRunSupport(context.origin.chain)) {
    return null
  }

  const result = await getXcmFeeInternal({
    api: origin.api,
    buildTx,
    origin: origin.chain,
    destination: dest.chain,
    sender,
    recipient,
    version,
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
