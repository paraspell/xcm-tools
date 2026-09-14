import { MAX_WEIGHT, MIN_FEE } from '../../../constants'
import {
  AmountTooLowError,
  DryRunFailedError,
  RoutingResolutionError,
  ScenarioNotSupportedError
} from '../../../errors'
import { dryRunInternal } from '../../../transfer'
import { supportsFeeAssetPayment } from '../../../transfer/utils/supportsFeeAssetPayment'
import type {
  TDryRunChainResult,
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics
} from '../../../types'
import { assertAddressIsString, assertSender } from '../..'
import { padValueBy } from '../../fees/padFee'
import { parseUnits } from '../../unit'
import { getFeeAssetInfo } from '../getFeeAssetInfo'
import { createExecuteCall } from './createExecuteCall'
import { createDirectExecuteXcm } from './createExecuteXcm'

const getFeeFromResult = (result?: TDryRunChainResult): bigint =>
  result?.success ? result.fee : MIN_FEE

const FEE_PADDING_PERCENTAGE = 40

export const handleExecuteTransfer = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TSerializedExtrinsics> => {
  const {
    api,
    chain,
    sender,
    paraIdTo,
    destChain,
    assetInfo,
    currency,
    feeCurrency,
    recipient,
    feeAssetInfo,
    version,
    transactOptions
  } = options

  assertSender(sender)
  assertAddressIsString(recipient)

  if (feeAssetInfo && !supportsFeeAssetPayment(chain)) {
    throw new ScenarioNotSupportedError(`Fee asset is not supported on ${chain}`)
  }

  const checkAmount = (fee: bigint) => {
    if (assetInfo.amount <= fee) throw new AmountTooLowError()
  }

  checkAmount(MIN_FEE)

  if (destChain === undefined) {
    throw new RoutingResolutionError('Could not determine destination chain for execute transfer')
  }

  const internalOptions = {
    api,
    chain,
    destChain,
    assetInfo,
    currency,
    feeAssetInfo,
    feeCurrency,
    sender,
    recipient,
    version,
    paraIdTo,
    transactOptions
  }

  // We mint 1000 units of feeAsset and use 100
  const FEE_ASSET_AMOUNT = 100

  const feeAssetAmount = feeAssetInfo
    ? parseUnits(FEE_ASSET_AMOUNT.toString(), feeAssetInfo.decimals)
    : MIN_FEE

  const resolvedFeeAssetInfo = getFeeAssetInfo(assetInfo, feeAssetInfo)
  const hopFeeAmount = resolvedFeeAssetInfo ? feeAssetAmount : MIN_FEE

  const call = createExecuteCall(
    chain,
    await createDirectExecuteXcm({
      ...internalOptions,
      fees: {
        originFee: feeAssetAmount,
        reserveFee: hopFeeAmount,
        destFee: hopFeeAmount
      }
    }),
    MAX_WEIGHT
  )

  const dryRunResult = await dryRunInternal({
    api,
    tx: api.deserializeExtrinsics(call),
    origin: chain,
    destination: destChain,
    sender,
    currency,
    version,
    feeAsset: feeCurrency,
    useRootOrigin: true
  })

  if (!dryRunResult.origin.success) {
    throw new DryRunFailedError({
      ...dryRunResult.origin.dryRunError,
      chainKind: 'origin',
      chain
    })
  }

  const originFee = padValueBy(dryRunResult.origin.fee, FEE_PADDING_PERCENTAGE)
  const reserveFee = padValueBy(
    getFeeFromResult(dryRunResult.hops.at(0)?.result),
    FEE_PADDING_PERCENTAGE
  )
  const destFee = padValueBy(getFeeFromResult(dryRunResult.destination), FEE_PADDING_PERCENTAGE)

  if (!resolvedFeeAssetInfo) checkAmount(reserveFee)

  const xcm = await createDirectExecuteXcm({
    ...internalOptions,
    fees: {
      originFee,
      reserveFee,
      destFee
    }
  })

  const weight = await api.getXcmWeight(xcm)

  return createExecuteCall(chain, xcm, weight)
}
