import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import { MAX_WEIGHT } from '../constants'
import { DryRunFailedError, InvalidParameterError } from '../errors'
import { type TPolkadotXCMTransferOptions, type TSerializedApiCall, Version } from '../types'
import { validateAddress } from '../utils'
import { createExecuteCall, createExecuteXcm } from '../utils/transfer'

export const transferExecute = async <TApi, TRes>(
  node: TNodePolkadotKusama,
  input: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedApiCall> => {
  const { api, senderAddress, asset, feeAsset, version = Version.V4 } = input

  if (!senderAddress) {
    throw new InvalidParameterError('Please provide senderAddress')
  }

  validateAddress(senderAddress, node, false)

  const decimals = asset.decimals as number
  const multiplier = decimals > 10 ? 0.4 : 0.15

  const base = BigInt(10 ** decimals)
  const scaledMultiplier = BigInt(Math.floor(multiplier * 10 ** decimals))
  const MIN_FEE = (base * scaledMultiplier) / BigInt(10 ** decimals)

  const call = createExecuteCall(createExecuteXcm(input, MIN_FEE, version), MAX_WEIGHT)

  const dryRunResult = await api.getDryRunCall({
    node,
    tx: api.callTxMethod(call),
    address: senderAddress,
    isFeeAsset: !!feeAsset
  })

  console.log('dryRunResult', dryRunResult)

  if (!dryRunResult.success) {
    throw new DryRunFailedError(dryRunResult.failureReason)
  }

  const paddedFee = (dryRunResult.fee * 120n) / 100n

  const xcm = createExecuteXcm(input, 170000n, version)

  const weight = await api.getXcmWeight(xcm)

  return createExecuteCall(xcm, weight)
}
