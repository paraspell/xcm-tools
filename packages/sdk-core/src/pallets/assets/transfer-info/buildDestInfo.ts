import {
  findAssetOnDestOrThrow,
  getNativeAssetSymbol,
  type TCurrencyCore,
  type WithAmount
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api'
import { InvalidParameterError, UnableToComputeError } from '../../../errors'
import type { TXcmFeeDetail } from '../../../types'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import { getEthErc20Balance } from '../balance/getEthErc20Balance'

export type TBuildDestInfoOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
  address: string
  currency: WithAmount<TCurrencyCore>
  originFee: bigint
  isFeeAssetAh: boolean
  destFeeDetail: TXcmFeeDetail
  assetHubFee?: bigint
  bridgeFee?: bigint
}

export const buildDestInfo = async <TApi, TRes>({
  api,
  origin,
  destination,
  address,
  currency,
  originFee,
  isFeeAssetAh,
  destFeeDetail,
  assetHubFee,
  bridgeFee
}: TBuildDestInfoOptions<TApi, TRes>) => {
  const destApi = api.clone()

  if (destination !== 'Ethereum') {
    await destApi.init(destination)
  }

  const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

  const edDest = destAsset.existentialDeposit

  if (!edDest) {
    throw new InvalidParameterError(
      `Existential deposit not found for ${destination} with currency ${JSON.stringify(currency)}`
    )
  }

  const edDestBn = BigInt(edDest)

  const destCurrency = destAsset.multiLocation
    ? { multilocation: destAsset.multiLocation }
    : { symbol: destAsset.symbol }

  const destBalance =
    destination === 'Ethereum'
      ? await getEthErc20Balance(destCurrency, address)
      : await getAssetBalanceInternal({
          api: destApi,
          address,
          node: destination,
          currency: destCurrency
        })

  const destAmount = isFeeAssetAh ? BigInt(currency.amount) - originFee : BigInt(currency.amount)

  let effectiveAmountForBalance = destAmount
  if (destination === 'Ethereum' && assetHubFee !== undefined) {
    effectiveAmountForBalance -= assetHubFee
  }

  const destBalanceSufficient =
    effectiveAmountForBalance - (destFeeDetail.fee as bigint) >
    (destBalance < edDestBn ? edDestBn : 0)

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
        receivedAmount = BigInt(currency.amount) - originFee - bridgeFee
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
  const isDestFeeInNativeCurrency = destFeeDetail.currency === getNativeAssetSymbol(destination)

  if (isDestFeeInNativeCurrency) {
    const destRecipientNativeBalance =
      destination === 'Ethereum'
        ? await getEthErc20Balance({ symbol: getNativeAssetSymbol(destination) }, address)
        : await getBalanceNativeInternal({
            address: address,
            node: destination,
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
      existentialDeposit: edDestBn
    },
    xcmFee: {
      fee: destFeeDetail.fee as bigint,
      balance: destXcmFeeBalance,
      balanceAfter: destXcmFeeBalanceAfter,
      currencySymbol: destFeeDetail.currency as string
    }
  }
}
