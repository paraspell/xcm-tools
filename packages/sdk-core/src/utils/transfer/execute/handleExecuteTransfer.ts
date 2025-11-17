import { isAssetEqual } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'

import { MAX_WEIGHT, MIN_FEE } from '../../../constants'
import { AmountTooLowError, DryRunFailedError, InvalidParameterError } from '../../../errors'
import { dryRunInternal } from '../../../transfer'
import type { THopInfo, TPolkadotXCMTransferOptions, TSerializedExtrinsics } from '../../../types'
import { assertAddressIsString, assertSenderAddress } from '../..'
import { padValueBy } from '../../fees/padFee'
import { parseUnits } from '../../unit'
import { createExecuteCall } from './createExecuteCall'
import { createDirectExecuteXcm } from './createExecuteXcm'

const getReserveFeeFromHops = (hops: THopInfo[] | undefined): bigint => {
  if (!hops || hops.length === 0 || !hops[0].result.success) {
    return MIN_FEE
  }

  return hops[0].result.fee
}

const FEE_PADDING_PERCENTAGE = 40

export const handleExecuteTransfer = async <TApi, TRes>(
  chain: TParachain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedExtrinsics> => {
  const {
    api,
    senderAddress,
    paraIdTo,
    destChain,
    assetInfo,
    currency,
    feeCurrency,
    address,
    feeAssetInfo,
    version
  } = options

  assertSenderAddress(senderAddress)
  assertAddressIsString(address)

  const checkAmount = (fee: bigint) => {
    if (assetInfo.amount <= fee) throw new AmountTooLowError()
  }

  checkAmount(MIN_FEE)

  if (destChain === undefined) {
    throw new InvalidParameterError('Could not determine destination chain for execute transfer')
  }

  const internalOptions = {
    api,
    chain,
    destChain,
    address,
    assetInfo,
    currency,
    feeAssetInfo,
    feeCurrency,
    recipientAddress: address,
    senderAddress,
    version,
    paraIdTo
  }

  // We mint 1000 units of feeAsset and use 100
  const FEE_ASSET_AMOUNT = 100

  const feeAssetAmount = feeAssetInfo
    ? parseUnits(FEE_ASSET_AMOUNT.toString(), feeAssetInfo.decimals)
    : MIN_FEE

  const call = createExecuteCall(
    chain,
    createDirectExecuteXcm({
      ...internalOptions,
      fees: {
        originFee: feeAssetAmount,
        reserveFee: MIN_FEE
      }
    }),
    MAX_WEIGHT
  )

  const dryRunResult = await dryRunInternal({
    api,
    tx: api.deserializeExtrinsics(call),
    origin: chain,
    destination: destChain,
    senderAddress,
    address,
    currency,
    feeAsset: feeCurrency,
    useRootOrigin: true
  })

  if (!dryRunResult.origin.success) {
    throw new DryRunFailedError(dryRunResult.failureReason as string)
  }

  const originFeeEstimate = dryRunResult.origin.fee
  const originFee = padValueBy(originFeeEstimate, FEE_PADDING_PERCENTAGE)

  const reserveFeeEstimate = getReserveFeeFromHops(dryRunResult.hops)
  const reserveFee = padValueBy(reserveFeeEstimate, FEE_PADDING_PERCENTAGE)

  checkAmount(
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo) ? reserveFee : originFee + reserveFee
  )

  const xcm = createDirectExecuteXcm({
    ...internalOptions,
    fees: {
      originFee,
      reserveFee
    }
  })

  const weight = await api.getXcmWeight(xcm)

  return createExecuteCall(chain, xcm, weight)
}
