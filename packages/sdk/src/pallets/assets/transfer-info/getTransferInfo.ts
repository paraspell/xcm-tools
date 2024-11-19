import { InvalidCurrencyError } from '../../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { determineRelayChainSymbol } from '../../../utils'
import { getNativeAssetSymbol } from '../assets'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'
import { getBalanceNativeInternal } from '../balance/getBalanceNative'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import {
  getExistentialDeposit,
  getMaxNativeTransferableAmount,
  getMinNativeTransferableAmount
} from '../getExistentialDeposit'
import { getOriginFeeDetailsInternal } from '../getOriginFeeDetails'

export const getTransferInfo = async <TApi, TRes>({
  origin,
  destination,
  accountOrigin,
  accountDestination,
  currency,
  amount,
  api
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  await api.init(origin)
  api.setDisconnectAllowed(false)

  try {
    const originBalance = await getBalanceNativeInternal({
      address: accountOrigin,
      node: origin,
      api
    })

    const xcmFeeDetails = await getOriginFeeDetailsInternal({
      origin,
      destination,
      currency,
      amount,
      account: accountOrigin,
      accountDestination,
      api
    })

    const expectedBalanceAfterXCMDelivery = originBalance - xcmFeeDetails.xcmFee

    const asset =
      getAssetBySymbolOrId(origin, currency, destination) ??
      (origin === 'AssetHubPolkadot' ? getAssetBySymbolOrId('Ethereum', currency, null) : null)

    if (!asset) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${origin}`)
    }

    return {
      chain: {
        origin,
        destination,
        ecosystem: determineRelayChainSymbol(origin)
      },
      currencyBalanceOrigin: {
        balance: await getAssetBalanceInternal({
          api,
          address: accountOrigin,
          node: origin,
          currency
        }),
        currency: asset?.symbol ?? ''
      },
      originFeeBalance: {
        balance: originBalance,
        expectedBalanceAfterXCMFee: expectedBalanceAfterXCMDelivery,
        xcmFee: xcmFeeDetails,
        existentialDeposit: BigInt(getExistentialDeposit(origin) ?? 0),
        asset: getNativeAssetSymbol(origin),
        minNativeTransferableAmount: getMinNativeTransferableAmount(origin),
        maxNativeTransferableAmount: await getMaxNativeTransferableAmount(
          api,
          accountOrigin,
          origin
        )
      },
      destinationFeeBalance: {
        balance: await getBalanceNativeInternal({
          address: accountDestination,
          node: destination,
          api
        }),
        currency: getNativeAssetSymbol(destination),
        existentialDeposit: getExistentialDeposit(destination)
      }
    }
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
