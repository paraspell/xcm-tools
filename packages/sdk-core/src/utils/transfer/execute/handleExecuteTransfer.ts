import type { TCurrencyCore } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import { MAX_WEIGHT } from '../../../constants'
import { DryRunFailedError, InvalidParameterError } from '../../../errors'
import { getTNode } from '../../../nodes/getTNode'
import { getAssetBalanceInternal } from '../../../pallets/assets'
import { dryRunInternal } from '../../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../../transfer/fees/padFee'
import type { THopInfo, TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../../types'
import { assertAddressIsString, determineRelayChain } from '../..'
import { createExecuteCall } from './createExecuteCall'
import { createDirectExecuteXcm } from './createExecuteXcm'

const validateHops = (hops: THopInfo[]): void => {
  for (const hop of hops) {
    if (!hop.result.success) {
      throw new DryRunFailedError(
        `Dry run failed on an intermediate hop (${hop.chain}). Reason: ${
          hop.result.failureReason || 'Unknown'
        }`
      )
    }
  }
}

const getReserveFeeFromHops = (hops: THopInfo[] | undefined): bigint => {
  if (!hops || hops.length === 0 || !hops[0].result.success) {
    return MIN_FEE
  }

  return hops[0].result.fee
}

const MIN_FEE = 1000n
const FEE_PADDING_PERCENTAGE = 40

export const handleExecuteTransfer = async <TApi, TRes>(
  chain: TNodePolkadotKusama,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedApiCall> => {
  const { api, senderAddress, paraIdTo, asset, currency, feeCurrency, address, feeAsset, version } =
    options

  if (!senderAddress) {
    throw new InvalidParameterError('Please provide senderAddress')
  }

  assertAddressIsString(address)

  const feeAssetBalance =
    feeCurrency && feeAsset && !isAssetEqual(asset, feeAsset)
      ? await getAssetBalanceInternal({
          api,
          address: senderAddress,
          node: chain,
          currency: feeCurrency as TCurrencyCore
        })
      : undefined

  const checkAmount = (fee: bigint) => {
    if (BigInt(asset.amount) <= fee) {
      throw new InvalidParameterError(
        `Asset amount is too low, please increase the amount or use a different fee asset.`
      )
    }
  }

  checkAmount(MIN_FEE)

  const destChain = getTNode(
    paraIdTo as number,
    determineRelayChain(chain) === 'Polkadot' ? 'polkadot' : 'kusama'
  ) as TNodePolkadotKusama

  const internalOptions = {
    api,
    chain,
    destChain,
    address,
    asset,
    currency,
    feeAsset,
    feeCurrency,
    recipientAddress: address,
    senderAddress,
    version
  }

  const call = createExecuteCall(
    chain,
    createDirectExecuteXcm({
      ...internalOptions,
      fees: {
        originFee: feeAssetBalance && feeAssetBalance > 1n ? feeAssetBalance : MIN_FEE,
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
    feeAsset: feeCurrency
  })

  if (!dryRunResult.origin.success) {
    throw new DryRunFailedError(dryRunResult.failureReason as string)
  }

  validateHops(dryRunResult.hops)

  const originFeeEstimate = dryRunResult.origin.fee
  const originFee = padFeeBy(originFeeEstimate, FEE_PADDING_PERCENTAGE)

  const reserveFeeEstimate = getReserveFeeFromHops(dryRunResult.hops)
  const reserveFee = padFeeBy(reserveFeeEstimate, FEE_PADDING_PERCENTAGE)

  checkAmount(feeAsset && !isAssetEqual(asset, feeAsset) ? reserveFee : originFee + reserveFee)

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
