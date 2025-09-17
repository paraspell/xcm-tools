import { getExistentialDepositOrThrow, normalizeSymbol } from '@paraspell/assets'
import { findAssetOnDestOrThrow } from '@paraspell/assets'

import { DryRunFailedError, InvalidParameterError, UnableToComputeError } from '../../errors'
import { getAssetBalanceInternal } from '../../pallets/assets'
import type { TGetXcmFeeResult, TVerifyEdOnDestinationOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { getXcmFeeInternal } from '../fees/getXcmFeeInternal'

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

export const verifyEdOnDestinationInternal = async <TApi, TRes>(
  options: TVerifyEdOnDestinationOptions<TApi, TRes>
) => {
  const { api, txs, origin, destination, currency, address, senderAddress, feeAsset } = options

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

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const destCurrency = asset.location ? { location: asset.location } : { symbol: asset.symbol }

  const ed = getExistentialDepositOrThrow(destination, destCurrency)

  const balance = await getAssetBalanceInternal({
    address,
    chain: destination,
    api: destApi,
    currency: destCurrency
  })

  const { tx, txBypass } = txs

  const xcmFeeResult = await getXcmFeeInternal({
    api,
    tx: txBypass,
    origin,
    destination,
    senderAddress,
    address,
    currency: {
      ...currency,
      amount
    },
    feeAsset,
    disableFallback: false,
    useRootOrigin: true
  })

  const {
    origin: { dryRunError },
    assetHub: assetHubFeeResult,
    bridgeHub: bridgeHubFeeResult,
    destination: { fee: destFee, currency: destFeeCurrency, dryRunError: destDryRunError }
  } = xcmFeeResult

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

  return amount - feeToSubtract > (balance < ed ? ed : 0)
}
