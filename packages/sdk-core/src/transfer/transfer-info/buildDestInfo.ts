import { findAssetOnDestOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { getEdFromAssetOrThrow } from '@paraspell/assets'

import { getAssetBalanceInternal, getBalanceNative } from '../../balance'
import { UnableToComputeError } from '../../errors'
import type { TBuildDestInfoOptions } from '../../types'

export const buildDestInfo = async <TApi, TRes>({
  api,
  origin,
  destination,
  address,
  currency,
  originFee,
  isFeeAssetAh,
  destFeeDetail,
  totalHopFee,
  bridgeFee
}: TBuildDestInfoOptions<TApi, TRes>) => {
  const destApi = api.clone()

  await destApi.init(destination)

  const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

  const edDest = getEdFromAssetOrThrow(destAsset)

  const destBalance = await getAssetBalanceInternal({
    api: destApi,
    address,
    chain: destination,
    asset: destAsset
  })

  const destAmount = isFeeAssetAh ? currency.amount - originFee : currency.amount

  const effectiveAmountForBalance = destAmount - totalHopFee

  const destBalanceSufficient =
    effectiveAmountForBalance - (destFeeDetail.fee as bigint) > (destBalance < edDest ? edDest : 0n)

  const destBalanceSufficientResult =
    destFeeDetail.currency !== destAsset.symbol && destination !== 'Ethereum'
      ? new UnableToComputeError(
          'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
        )
      : destBalanceSufficient

  const destBalanceAfter =
    destBalance -
    (destFeeDetail.currency === destAsset.symbol ? (destFeeDetail.fee as bigint) : 0n) +
    effectiveAmountForBalance

  const destbalanceAfterResult =
    destFeeDetail.currency !== destAsset.symbol && destination !== 'Ethereum'
      ? new UnableToComputeError(
          'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
        )
      : destBalanceAfter

  let receivedAmount: bigint | UnableToComputeError

  const isAssetHubToAssetHubRoute =
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot') ||
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama')

  if (isAssetHubToAssetHubRoute) {
    const nativeAssetOfOriginSymbol = getNativeAssetSymbol(origin)
    let isOriginAssetNative = false

    if (destAsset.symbol === nativeAssetOfOriginSymbol) {
      isOriginAssetNative = true
    }

    if (isOriginAssetNative) {
      if (bridgeFee === undefined) {
        receivedAmount = new UnableToComputeError(
          `bridgeFee is required for native asset transfer from ${origin} to ${destination} but was not provided.`
        )
      } else {
        receivedAmount = currency.amount - originFee - bridgeFee
      }
    } else {
      receivedAmount = new UnableToComputeError(
        `Unable to compute received amount: The transferred asset (${destAsset.symbol}) is not the native asset (${nativeAssetOfOriginSymbol}) of origin ${origin} for the ${origin}->${destination} route.`
      )
    }
  } else {
    if (destbalanceAfterResult instanceof UnableToComputeError) {
      receivedAmount = destbalanceAfterResult
    } else {
      receivedAmount = destbalanceAfterResult - destBalance
    }
  }

  let destXcmFeeBalance: bigint
  const isDestFeeInNativeCurrency = destFeeDetail.asset.symbol === getNativeAssetSymbol(destination)

  if (isDestFeeInNativeCurrency) {
    const destRecipientNativeBalance = await getBalanceNative({
      address: address,
      chain: destination,
      api: destApi
    })
    destXcmFeeBalance = destRecipientNativeBalance
  } else {
    destXcmFeeBalance = destBalance
  }

  const destXcmFeeBalanceAfter = isFeeAssetAh
    ? destBalanceAfter
    : destXcmFeeBalance -
      (destFeeDetail.fee as bigint) +
      (destFeeDetail.currency === destAsset.symbol ? effectiveAmountForBalance : 0n)

  return {
    receivedCurrency: {
      sufficient: destBalanceSufficientResult,
      receivedAmount,
      balance: destBalance,
      balanceAfter: destbalanceAfterResult,
      currencySymbol: destAsset.symbol,
      asset: destAsset,
      existentialDeposit: edDest
    },
    xcmFee: {
      fee: destFeeDetail.fee as bigint,
      balance: destXcmFeeBalance,
      balanceAfter: destXcmFeeBalanceAfter,
      currencySymbol: destFeeDetail.currency,
      asset: destFeeDetail.asset
    }
  }
}
