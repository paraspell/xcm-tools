import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'

import { MAX_WEIGHT } from '../../constants'
import { InvalidAddressError } from '../../errors'
import { dryRunInternal, getXcmFeeOnce } from '../../transfer'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { assertSenderAddress, assertToIsString } from '../assertions'
import { padValueBy } from '../fees/padFee'
import { createExecuteExchangeXcm } from './execute'

export const handleToAhTeleport = async <TApi, TRes, TSigner>(
  origin: TParachain,
  input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>,
  defaultTx: TRes
): Promise<TRes> => {
  const { api, destination, address, senderAddress, assetInfo: asset, currency, version } = input

  assertToIsString(destination, 'Location destination is not supported for AH teleport.')

  if (isTLocation(address)) {
    throw new InvalidAddressError('Location address is not supported for this scenario')
  }

  assertSenderAddress(senderAddress)

  const dryRunResult = await dryRunInternal({
    api,
    tx: defaultTx,
    origin,
    destination,
    senderAddress: senderAddress,
    address,
    currency,
    version
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

  const feeResult = await getXcmFeeOnce({
    api,
    tx: dummyTx,
    origin,
    destination,
    senderAddress: senderAddress,
    address,
    version,
    currency: currency as WithAmount<TCurrencyCore>,
    disableFallback: false,
    useRootOrigin: true
  })

  const originExecutionFee = padValueBy(feeResult.origin.fee, 20) // Pad by 20%
  const destinationExecutionFee = padValueBy(
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
