import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  getRelayChainSymbol
} from '@paraspell/assets'

import { InvalidParameterError, UnableToComputeError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'

export const getTransferInfo = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  address,
  currency
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  await api.init(origin)
  api.setDisconnectAllowed(false)

  const destApi = api.clone()
  await destApi.init(destination)
  destApi.setDisconnectAllowed(false)

  try {
    const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

    const destCurrency = destAsset.multiLocation
      ? { multilocation: destAsset.multiLocation }
      : { symbol: destAsset.symbol }

    const originBalanceNative = await getBalanceNativeInternal({
      address: senderAddress,
      node: origin,
      api
    })

    const originBalance = await getAssetBalanceInternal({
      api,
      address: senderAddress,
      node: origin,
      currency
    })

    const destBalance = await getAssetBalanceInternal({
      api: destApi,
      address,
      node: destination,
      currency: destCurrency
    })

    const edOrigin = getExistentialDeposit(origin, currency)

    if (!edOrigin) {
      throw new InvalidParameterError(
        `Existential deposit not found for ${origin} with currency ${JSON.stringify(currency)}`
      )
    }

    const edOriginBn = BigInt(edOrigin)

    const edDest = getExistentialDeposit(destination, destCurrency)

    if (!edDest) {
      throw new InvalidParameterError(
        `Existential deposit not found for ${destination} with currency ${JSON.stringify(currency)}`
      )
    }

    const edDestBn = BigInt(edDest)

    const {
      origin: { fee: originFee, currency: originFeeCurrency },
      destination: { fee: destFee, currency: destFeeCurrency }
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

    if (originFee === undefined) {
      throw new Error(
        `Cannot get origin xcm fee for currency ${JSON.stringify(currency)} on node ${origin}.`
      )
    }

    let destXcmFeeBalance: bigint
    const isDestFeeInNativeCurrency = destFeeCurrency === getNativeAssetSymbol(destination)

    if (isDestFeeInNativeCurrency) {
      const destRecipientNativeBalance = await getBalanceNativeInternal({
        address: address,
        node: destination,
        api: destApi
      })
      destXcmFeeBalance = destRecipientNativeBalance
    } else {
      destXcmFeeBalance = destBalance
    }

    const originBalanceAfter = originBalance - BigInt(currency.amount)

    const originBalanceNativeAfter = originBalanceNative - originFee

    const originBalanceNativeSufficient = originBalanceNative >= originFee

    const originBalanceSufficient = originBalanceAfter >= edOriginBn

    const destBalanceSufficient =
      BigInt(currency.amount) - (destFee as bigint) > (destBalance < edDestBn ? edDestBn : 0)

    const destBalanceSufficientResult =
      destFeeCurrency !== destAsset.symbol
        ? new UnableToComputeError(
            'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
          )
        : destBalanceSufficient

    const destBalanceAfter =
      destBalance -
      (destFeeCurrency === destAsset.symbol ? (destFee as bigint) : 0n) +
      BigInt(currency.amount)

    const destbalanceAfterResult =
      destFeeCurrency !== destAsset.symbol
        ? new UnableToComputeError(
            'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
          )
        : destBalanceAfter

    const destXcmFeeBalanceAfter =
      destXcmFeeBalance -
      (destFee as bigint) +
      (destFeeCurrency === destAsset.symbol ? BigInt(currency.amount) : 0n)

    return {
      chain: {
        origin,
        destination,
        ecosystem: getRelayChainSymbol(origin)
      },
      origin: {
        selectedCurrency: {
          sufficient: originBalanceSufficient,
          balance: originBalance,
          balanceAfter: originBalanceAfter,
          currencySymbol: destAsset.symbol,
          existentialDeposit: edOriginBn
        },
        xcmFee: {
          sufficient: originBalanceNativeSufficient,
          fee: originFee,
          balance: originBalanceNative,
          balanceAfter: originBalanceNativeAfter,
          currencySymbol: originFeeCurrency as string
        }
      },
      destination: {
        receivedCurrency: {
          sufficient: destBalanceSufficientResult,
          balance: destBalance,
          balanceAfter: destbalanceAfterResult,
          currencySymbol: destAsset.symbol,
          existentialDeposit: edDestBn
        },
        xcmFee: {
          fee: destFee as bigint,
          balance: destXcmFeeBalance,
          balanceAfter: destXcmFeeBalanceAfter,
          currencySymbol: destFeeCurrency as string
        }
      }
    }
  } finally {
    api.setDisconnectAllowed(true)
    destApi.setDisconnectAllowed(true)
    await api.disconnect()
    await destApi.disconnect()
  }
}
