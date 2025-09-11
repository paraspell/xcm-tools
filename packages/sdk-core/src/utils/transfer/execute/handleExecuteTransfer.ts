import { isAssetEqual } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'
import { parseUnits } from 'viem'

import { getTChain } from '../../../chains/getTChain'
import { MAX_WEIGHT, MIN_FEE } from '../../../constants'
import { DryRunFailedError, InvalidParameterError } from '../../../errors'
import { dryRunInternal } from '../../../transfer'
import type { THopInfo, TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../../types'
import { assertAddressIsString, getRelayChainOf } from '../..'
import { padFeeBy } from '../../fees/padFee'
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
): Promise<TSerializedApiCall> => {
  const {
    api,
    senderAddress,
    paraIdTo,
    assetInfo,
    currency,
    feeCurrency,
    address,
    feeAssetInfo,
    version
  } = options

  if (!senderAddress) {
    throw new InvalidParameterError('Please provide senderAddress')
  }

  assertAddressIsString(address)

  const checkAmount = (fee: bigint) => {
    if (assetInfo.amount <= fee) {
      throw new InvalidParameterError(
        `Asset amount is too low, please increase the amount or use a different fee asset.`
      )
    }
  }

  checkAmount(MIN_FEE)

  const destChain = getTChain(paraIdTo as number, getRelayChainOf(chain)) as TParachain

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
    tx: api.callTxMethod(call),
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
  const originFee = padFeeBy(originFeeEstimate, FEE_PADDING_PERCENTAGE)

  const reserveFeeEstimate = getReserveFeeFromHops(dryRunResult.hops)
  const reserveFee = padFeeBy(reserveFeeEstimate, FEE_PADDING_PERCENTAGE)

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
