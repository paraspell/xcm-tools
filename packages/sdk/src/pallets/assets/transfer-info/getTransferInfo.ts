import { InvalidCurrencyError } from '../../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'
import { getBalanceNativeInternal } from '../balance/getBalanceNative'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getMaxNativeTransferableAmount } from '../getTransferableAmount'
import { getOriginFeeDetailsInternal } from '../getOriginFeeDetails'
import { getExistentialDeposit, getNativeAssetSymbol, getRelayChainSymbol } from '../assets'

export const getTransferInfo = async <TApi, TRes>({
  origin,
  destination,
  accountOrigin,
  accountDestination,
  currency,
  api
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  await api.init(origin)
  api.setDisconnectAllowed(false)
  const destApi = api.clone()
  await destApi.init(destination)
  destApi.setDisconnectAllowed(false)

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
        ecosystem: getRelayChainSymbol(origin)
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
        minNativeTransferableAmount: BigInt(getExistentialDeposit(origin) ?? '0'),
        maxNativeTransferableAmount: await getMaxNativeTransferableAmount({
          api,
          address: accountOrigin,
          node: origin
        })
      },
      destinationFeeBalance: {
        balance: await getBalanceNativeInternal({
          address: accountDestination,
          node: destination,
          api: destApi
        }),
        currency: getNativeAssetSymbol(destination),
        existentialDeposit: BigInt(getExistentialDeposit(destination) ?? '0')
      }
    }
  } finally {
    api.setDisconnectAllowed(true)
    api.setDisconnectAllowed(true)
    await api.disconnect()
    await destApi.disconnect()
  }
}
