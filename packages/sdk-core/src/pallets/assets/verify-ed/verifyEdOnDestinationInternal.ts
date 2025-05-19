import { getExistentialDeposit, normalizeSymbol } from '@paraspell/assets'
import { findAssetOnDestOrThrow } from '@paraspell/assets'

import { DryRunFailedError, UnableToComputeError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import type { TVerifyEdOnDestinationOptions } from '../../../types'
import { validateAddress } from '../../../utils'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'

export const verifyEdOnDestinationInternal = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  address,
  senderAddress,
  currency
}: TVerifyEdOnDestinationOptions<TApi, TRes>) => {
  validateAddress(address, destination)

  const destApi = api.clone()
  await destApi.init(destination)

  const asset = findAssetOnDestOrThrow(origin, destination, currency)

  const destCurrency = asset.multiLocation
    ? { multilocation: asset.multiLocation }
    : { symbol: asset.symbol }

  const ed = getExistentialDeposit(destination, destCurrency)

  if (ed === null) {
    throw new Error(`Cannot get existential deposit for currency ${JSON.stringify(currency)}`)
  }

  const edBN = BigInt(ed)

  const balance = await getAssetBalanceInternal({
    address,
    node: destination,
    api: destApi,
    currency: destCurrency
  })

  const {
    origin: { dryRunError },
    destination: { fee: destFee, currency: destFeeCurrency, dryRunError: destDryRunError }
  } = await getXcmFee({
    api,
    tx,
    origin,
    destination,
    senderAddress,
    address,
    currency,
    disableFallback: false
  })

  if (destFee === undefined) {
    throw new Error(
      `Cannot get destination xcm fee for currency ${JSON.stringify(currency)} on node ${destination}.`
    )
  }

  if (dryRunError) {
    throw new DryRunFailedError(dryRunError, 'origin')
  }

  if (destDryRunError) {
    throw new UnableToComputeError(
      `Unable to compute fee for the destination asset. Destination dry run error: ${destDryRunError}`
    )
  }

  if (normalizeSymbol(asset.symbol) !== normalizeSymbol(destFeeCurrency)) {
    throw new UnableToComputeError(
      `The XCM fee could not be calculated because the origin or destination chain does not support DryRun.
       As a result, fee estimation is only available through PaymentInfo, which provides the cost in the native asset.
       This limitation restricts support to transfers involving the native asset of the Destination chain only.`
    )
  }

  return BigInt(currency.amount) - destFee > (balance < edBN ? edBN : 0)
}
