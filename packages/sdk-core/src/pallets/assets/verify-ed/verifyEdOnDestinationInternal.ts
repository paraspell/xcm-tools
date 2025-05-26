import { getExistentialDeposit, normalizeSymbol } from '@paraspell/assets'
import { findAssetOnDestOrThrow } from '@paraspell/assets'

import { DryRunFailedError, InvalidParameterError, UnableToComputeError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import type { TGetXcmFeeResult, TVerifyEdOnDestinationOptions } from '../../../types'
import { validateAddress } from '../../../utils'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'

export const calculateTotalXcmFee = (feeResult: TGetXcmFeeResult): bigint => {
  let totalFee = 0n

  if (feeResult.assetHub?.fee !== undefined) {
    totalFee += feeResult.assetHub.fee
  }

  if (feeResult.destination.fee !== undefined) {
    totalFee += feeResult.destination.fee
  }

  return totalFee
}

export const verifyEdOnDestinationInternal = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  address,
  senderAddress,
  feeAsset,
  currency
}: TVerifyEdOnDestinationOptions<TApi, TRes>) => {
  if (destination === 'Ethereum') return true

  validateAddress(address, destination)

  if (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') {
    throw new InvalidParameterError(
      'Kusama is outside of Polkadot ecosystem, thus function is unable to verify the existential deposit for it.'
    )
  }
  if (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot') {
    throw new InvalidParameterError(
      'Polkadot is outside of Kusama ecosystem, thus function is unable to verify the existential deposit for it.'
    )
  }

  const destApi = api.clone()
  await destApi.init(destination)

  const asset = findAssetOnDestOrThrow(origin, destination, currency)

  const destCurrency = asset.multiLocation
    ? { multilocation: asset.multiLocation }
    : { symbol: asset.symbol }

  const ed = getExistentialDeposit(destination, destCurrency)

  if (ed === null) {
    throw new InvalidParameterError(
      `Cannot get existential deposit for currency ${JSON.stringify(currency)}`
    )
  }

  const edBN = BigInt(ed)

  const balance = await getAssetBalanceInternal({
    address,
    node: destination,
    api: destApi,
    currency: destCurrency
  })

  const xcmFeeResult = await getXcmFee({
    api,
    tx,
    origin,
    destination,
    senderAddress,
    address,
    currency,
    feeAsset,
    disableFallback: false
  })

  const {
    origin: { dryRunError },
    assetHub: assetHubFeeResult,
    bridgeHub: bridgeHubFeeResult,
    destination: { fee: destFee, currency: destFeeCurrency, dryRunError: destDryRunError }
  } = xcmFeeResult

  if (destFee === undefined) {
    throw new InvalidParameterError(
      `Cannot get destination xcm fee for currency ${JSON.stringify(currency)} on node ${destination}.`
    )
  }

  if (dryRunError) {
    throw new DryRunFailedError(dryRunError, 'origin')
  }

  const hopDryRunError = assetHubFeeResult?.dryRunError || bridgeHubFeeResult?.dryRunError
  if (hopDryRunError) {
    throw new DryRunFailedError(
      hopDryRunError,
      assetHubFeeResult?.dryRunError ? 'assetHub' : 'bridgeHub'
    )
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

  const totalFee = calculateTotalXcmFee(xcmFeeResult)
  const method = api.getMethod(tx)

  let feeToSubtract: bigint

  if (
    method === 'transfer_assets_using_type_and_then' ||
    method === 'transferAssetsUsingTypeAndThen'
  ) {
    feeToSubtract = totalFee
  } else {
    feeToSubtract = destFee
  }

  return BigInt(currency.amount) - feeToSubtract > (balance < edBN ? edBN : 0)
}
