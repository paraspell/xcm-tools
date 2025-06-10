import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'
import { isTMultiLocation } from '@paraspell/sdk-common'

import { MAX_WEIGHT } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getXcmFee } from '../../transfer'
import { dryRunInternal } from '../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../transfer/fees/padFee'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { createExecuteExchangeXcm } from './createExecuteExchangeXcm'

export const handleToAhTeleport = async <TApi, TRes>(
  origin: TNodePolkadotKusama,
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  defaultTx: TRes
): Promise<TRes> => {
  const { api, destination, address, senderAddress, asset, currency } = input

  if (isTMultiLocation(destination)) {
    throw new InvalidParameterError('Multi-Location destination is not supported for this scenario')
  }

  if (isTMultiLocation(address)) {
    throw new InvalidParameterError('Multi-Location address is not supported for this scenario')
  }

  if (!senderAddress) {
    throw new InvalidParameterError(`Please provide senderAddress`)
  }

  const dryRunResult = await dryRunInternal({
    api,
    tx: defaultTx,
    origin,
    destination,
    senderAddress: senderAddress,
    address,
    currency
  })

  // Default transaction is good to go, no need to use execute
  if (dryRunResult.destination?.success) {
    return defaultTx
  }

  // If the default tx dry run failed, we need to create execute transaction
  const dummyTx = createExecuteExchangeXcm(
    input,
    MAX_WEIGHT,
    // Enter dummy fee values just to get the dry run to pass
    BigInt(asset.amount),
    BigInt(asset.amount) / 2n
  )

  const feeResult = await getXcmFee({
    api,
    tx: dummyTx,
    origin,
    destination,
    senderAddress: senderAddress,
    address,
    currency: currency as WithAmount<TCurrencyCore>,
    disableFallback: false
  })

  const originExecutionFee = padFeeBy(feeResult.origin.fee as bigint, 20) // Pad by 20%
  const destinationExecutionFee = padFeeBy(
    // Pad by 20%
    feeResult.destination.feeType === 'paymentInfo'
      ? (feeResult.origin.fee as bigint)
      : (feeResult.destination.fee as bigint),
    20
  )

  return createExecuteExchangeXcm(
    input,
    feeResult.origin.weight ?? MAX_WEIGHT,
    originExecutionFee,
    destinationExecutionFee
  )
}
