import { InvalidCurrencyError } from '../../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { determineRelayChainSymbol } from '../../../utils'
import { getNativeAssetSymbol } from '../assets'
import { getAssetBalance } from '../balance/getAssetBalance'
import { getBalanceNative } from '../balance/getBalanceNative'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import {
  getExistentialDeposit,
  getMaxNativeTransferableAmount,
  getMinNativeTransferableAmount
} from '../getExistentialDeposit'
import { getOriginFeeDetails } from '../getOriginFeeDetails'

export const getTransferInfo = async <TApi, TRes>({
  origin,
  destination,
  accountOrigin,
  accountDestination,
  currency,
  amount,
  api: originApi
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  await originApi.init(origin)
  const originBalance = await getBalanceNative({
    address: accountOrigin,
    node: origin,
    api: originApi
  })
  const { xcmFee: destXcmFee } = await getOriginFeeDetails(
    origin,
    destination,
    currency,
    amount,
    accountOrigin,
    originApi
  )
  const expectedBalanceAfterXCMDelivery = originBalance - destXcmFee

  const asset = getAssetBySymbolOrId(origin, currency)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${'symbol' in currency ? currency.symbol : currency.id} not found on ${origin}`
    )
  }

  return {
    chain: {
      origin,
      destination,
      ecosystem: determineRelayChainSymbol(origin)
    },
    currencyBalanceOrigin: {
      balance: await getAssetBalance({
        api: originApi,
        address: accountOrigin,
        node: origin,
        currency
      }),
      currency: asset?.symbol ?? ''
    },
    originFeeBalance: {
      balance: await getBalanceNative({
        address: accountOrigin,
        node: origin,
        api: originApi
      }),
      expectedBalanceAfterXCMFee: expectedBalanceAfterXCMDelivery,
      xcmFee: await getOriginFeeDetails(
        origin,
        destination,
        currency,
        amount,
        accountOrigin,
        originApi
      ),
      existentialDeposit: BigInt(getExistentialDeposit(origin) ?? 0),
      asset: getNativeAssetSymbol(origin),
      minNativeTransferableAmount: getMinNativeTransferableAmount(origin),
      maxNativeTransferableAmount: await getMaxNativeTransferableAmount(
        originApi,
        accountOrigin,
        origin
      )
    },
    destinationFeeBalance: {
      balance: await getBalanceNative({
        address: accountDestination,
        node: destination,
        api: originApi
      }),
      currency: getNativeAssetSymbol(destination),
      existentialDeposit: getExistentialDeposit(destination)
    }
  }
}
