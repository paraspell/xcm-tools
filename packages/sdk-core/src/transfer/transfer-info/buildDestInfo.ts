import { findAssetOnDestOrThrow, getNativeAssetSymbol, isSymbolMatch } from '@paraspell/assets'
import { getEdFromAssetOrThrow } from '@paraspell/assets'
import { isSubstrateBridge } from '@paraspell/sdk-common'

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

  const destFeeAssetEqual = isSymbolMatch(destFeeDetail.asset.symbol, destAsset.symbol)
  const effectiveDestFee = destFeeAssetEqual ? (destFeeDetail.fee as bigint) : 0n

  const effectiveAmountForBalance = destAmount - totalHopFee

  const destBalanceSufficient =
    effectiveAmountForBalance - effectiveDestFee > (destBalance < edDest ? edDest : 0n)

  const destBalanceAfter = destBalance - effectiveDestFee + effectiveAmountForBalance

  const createUnableToComputeError = () =>
    new UnableToComputeError(
      'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
    )

  const isUnableToCompute = destFeeDetail.feeType === 'paymentInfo' && !destFeeAssetEqual

  const destbalanceAfterResult = isUnableToCompute ? createUnableToComputeError() : destBalanceAfter

  const destBalanceSufficientResult = isUnableToCompute
    ? createUnableToComputeError()
    : destBalanceSufficient

  let receivedAmount: bigint | UnableToComputeError

  const isSubBridge = isSubstrateBridge(origin, destination)

  if (isSubBridge) {
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
      (destFeeAssetEqual ? effectiveAmountForBalance : 0n)

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
      currencySymbol: destFeeDetail.asset.symbol,
      asset: destFeeDetail.asset
    }
  }
}
