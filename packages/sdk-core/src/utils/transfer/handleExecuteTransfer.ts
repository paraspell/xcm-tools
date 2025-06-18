import type { TCurrencyCore } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import { MAX_WEIGHT } from '../../constants'
import { DryRunFailedError, InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import { getAssetBalanceInternal } from '../../pallets/assets'
import { dryRunInternal } from '../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../transfer/fees/padFee'
import type { TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import { assertAddressIsString, determineRelayChain } from '..'
import { validateAddress } from '../validateAddress'
import { createExecuteCall } from './createExecuteCall'
import { createExecuteXcm } from './createExecuteXcm'

export const handleExecuteTransfer = async <TApi, TRes>(
  node: TNodePolkadotKusama,
  input: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedApiCall> => {
  const { api, senderAddress, paraIdTo, asset, currency, feeCurrency, address, feeAsset, version } =
    input

  if (!senderAddress) {
    throw new InvalidParameterError('Please provide senderAddress')
  }

  assertAddressIsString(address)

  validateAddress(senderAddress, node, false)

  const feeAssetBalance =
    feeCurrency && feeAsset && !isAssetEqual(asset, feeAsset)
      ? await getAssetBalanceInternal({
          api,
          address: senderAddress,
          node,
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

  const MIN_FEE = 1000n

  checkAmount(MIN_FEE)

  const call = createExecuteCall(
    createExecuteXcm(
      node,
      input,
      feeAssetBalance && feeAssetBalance > 1n ? feeAssetBalance : MIN_FEE,
      MIN_FEE,
      version
    ),
    MAX_WEIGHT
  )

  const destNode = getTNode(
    paraIdTo as number,
    determineRelayChain(node) === 'Polkadot' ? 'polkadot' : 'kusama'
  ) as TNodePolkadotKusama

  const dryRunResult = await dryRunInternal({
    api,
    tx: api.callTxMethod(call),
    origin: node,
    destination: destNode,
    senderAddress,
    address,
    currency,
    feeAsset: feeCurrency
  })

  if (!dryRunResult.origin.success) {
    throw new DryRunFailedError(dryRunResult.failureReason as string)
  }

  // Check assetHub if it exists
  if (dryRunResult.assetHub && !dryRunResult.assetHub.success) {
    throw new DryRunFailedError(dryRunResult.failureReason as string)
  }

  // Check hops if assetHub doesn't exist
  if (!dryRunResult.assetHub && dryRunResult.hops) {
    if (dryRunResult.hops.length > 1) {
      throw new InvalidParameterError(
        `Multiple intermediate hops detected (${dryRunResult.hops.length}). Only single hop transfers are supported.`
      )
    }

    // Check if the single hop failed
    if (dryRunResult.hops.length === 1 && !dryRunResult.hops[0].result.success) {
      throw new DryRunFailedError(dryRunResult.failureReason as string)
    }
  }

  const paddedFee = padFeeBy(dryRunResult.origin.fee, 20)

  let hopFee: bigint
  if (dryRunResult.assetHub) {
    hopFee = dryRunResult.assetHub.fee
  } else if (
    dryRunResult.hops &&
    dryRunResult.hops.length === 1 &&
    dryRunResult.hops[0].result.success
  ) {
    hopFee = dryRunResult.hops[0].result.fee
  } else {
    hopFee = MIN_FEE
  }

  const paddedHopFee = padFeeBy(hopFee, 40)

  checkAmount(feeAsset && !isAssetEqual(asset, feeAsset) ? paddedHopFee : paddedFee + paddedHopFee)

  const xcm = createExecuteXcm(node, input, paddedFee, paddedHopFee, version)

  const weight = await api.getXcmWeight(xcm)

  return createExecuteCall(xcm, weight)
}
