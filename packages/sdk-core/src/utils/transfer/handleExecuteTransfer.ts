import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import { DryRunFailedError, InvalidParameterError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { validateAddress } from '../validateAddress'
import { createExecuteXcm } from './createExecuteXcm'

export const handleExecuteTransfer = async <TApi, TRes>(
  node: TNodePolkadotKusama,
  input: TPolkadotXCMTransferOptions<TApi, TRes>
) => {
  const { api, senderAddress, asset, feeAsset } = input

  if (!senderAddress) {
    throw new InvalidParameterError('Please provide senderAddress')
  }

  validateAddress(senderAddress, node, false)

  const decimals = asset.decimals as number
  const multiplier = decimals > 10 ? 0.4 : 0.15

  const base = BigInt(10 ** decimals)

  const scaledMultiplier = BigInt(Math.floor(multiplier * 10 ** decimals))

  const MIN_FEE = (base * scaledMultiplier) / BigInt(10 ** decimals)

  const maxU64 = (1n << 64n) - 1n
  const dummyTx = createExecuteXcm(input, { refTime: maxU64, proofSize: maxU64 }, MIN_FEE)

  return dummyTx

  // const dryRunResult = await api.getDryRunCall({
  //   node,
  //   tx: dummyTx,
  //   address: senderAddress,
  //   isFeeAsset: !!feeAsset
  // })

  // if (!dryRunResult.success) {
  //   throw new DryRunFailedError(dryRunResult.failureReason)
  // }

  // if (!dryRunResult.weight) {
  //   throw new DryRunFailedError('weight not found')
  // }

  // const paddedFee = (dryRunResult.fee * 120n) / 100n

  // return createExecuteXcm(input, dryRunResult.weight, paddedFee)
}
