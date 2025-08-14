import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'

import { MAX_WEIGHT } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getXcmFee } from '../../transfer'
import { dryRunInternal } from '../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../transfer/fees/padFee'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { createExecuteExchangeXcm } from './execute'

export const handleToAhTeleport = async <TApi, TRes>(
  origin: TParachain,
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  defaultTx: TRes
): Promise<TRes> => {
  const { api, destination, address, senderAddress, assetInfo: asset, currency } = input

  if (isTLocation(destination)) {
    throw new InvalidParameterError('Location destination is not supported for this scenario')
  }

  if (isTLocation(address)) {
    throw new InvalidParameterError('Location address is not supported for this scenario')
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
    origin,
    MAX_WEIGHT,
    // Enter dummy fee values just to get the dry run to pass
    asset.amount,
    asset.amount / 2n
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

  const originExecutionFee = padFeeBy(feeResult.origin.fee, 20) // Pad by 20%
  const destinationExecutionFee = padFeeBy(
    // Pad by 20%
    feeResult.destination.feeType === 'paymentInfo'
      ? feeResult.origin.fee
      : feeResult.destination.fee,
    20
  )

  return createExecuteExchangeXcm(
    input,
    origin,
    feeResult.origin.weight ?? MAX_WEIGHT,
    originExecutionFee,
    destinationExecutionFee
  )
}
