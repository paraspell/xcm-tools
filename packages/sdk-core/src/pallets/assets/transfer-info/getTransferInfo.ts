import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  isAssetEqual
} from '@paraspell/assets'

import { InvalidParameterError, UnableToComputeError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import { resolveFeeAsset } from '../../../transfer/utils/resolveFeeAsset'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'

export const getTransferInfo = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  address,
  currency,
  feeAsset
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

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

    const originBalanceFee =
      feeAsset && resolvedFeeAsset
        ? await getAssetBalanceInternal({
            api,
            address: senderAddress,
            node: origin,
            currency: feeAsset
          })
        : await getBalanceNativeInternal({
            api,
            address: senderAddress,
            node: origin
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
      feeAsset,
      disableFallback: false
    })

    if (originFee === undefined) {
      throw new InvalidParameterError(
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

    const isFeeAssetAh =
      origin === 'AssetHubPolkadot' && resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, destAsset)

    const originBalanceAfter = originBalance - BigInt(currency.amount)

    const originBalanceFeeAfter = isFeeAssetAh
      ? originBalanceFee - BigInt(currency.amount)
      : originBalanceFee - originFee

    const originBalanceNativeSufficient = originBalanceFee >= originFee

    const originBalanceSufficient = originBalanceAfter >= edOriginBn

    const destAmount = isFeeAssetAh ? BigInt(currency.amount) - originFee : BigInt(currency.amount)

    const destBalanceSufficient =
      destAmount - (destFee as bigint) > (destBalance < edDestBn ? edDestBn : 0)

    const destBalanceSufficientResult =
      destFeeCurrency !== destAsset.symbol
        ? new UnableToComputeError(
            'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
          )
        : destBalanceSufficient

    const destBalanceAfter =
      destBalance - (destFeeCurrency === destAsset.symbol ? (destFee as bigint) : 0n) + destAmount

    const destbalanceAfterResult =
      destFeeCurrency !== destAsset.symbol
        ? new UnableToComputeError(
            'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
          )
        : destBalanceAfter

    const receivedAmount =
      destbalanceAfterResult instanceof UnableToComputeError
        ? destbalanceAfterResult
        : destbalanceAfterResult - destBalance

    const destXcmFeeBalanceAfter = isFeeAssetAh
      ? destBalanceAfter
      : destXcmFeeBalance -
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
          balance: originBalanceFee,
          balanceAfter: originBalanceFeeAfter,
          currencySymbol: originFeeCurrency as string
        }
      },
      destination: {
        receivedCurrency: {
          sufficient: destBalanceSufficientResult,
          receivedAmount,
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
