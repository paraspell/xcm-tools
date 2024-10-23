import { InvalidCurrencyError } from '../../../errors'
import type { TCurrencyCore, TNodeDotKsmWithRelayChains } from '../../../types'
import type { TTransferInfo } from '../../../types/TTransferInfo'
import { createApiInstanceForNode, determineRelayChainSymbol } from '../../../utils'
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

/**
 * Retrieves detailed transfer information for a cross-chain transfer.
 *
 * @param origin - The origin node of the transfer.
 * @param destination - The destination node of the transfer.
 * @param accountOrigin - The account address on the origin node.
 * @param accountDestination - The account address on the destination node.
 * @param currency - The currency to be transferred.
 * @param amount - The amount to be transferred.
 * @returns A Promise that resolves to the transfer information.
 */
export const getTransferInfo = async (
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeDotKsmWithRelayChains,
  accountOrigin: string,
  accountDestination: string,
  currency: TCurrencyCore,
  amount: string
): Promise<TTransferInfo> => {
  const originApi = await createApiInstanceForNode(origin)
  const originBalance = await getBalanceNative(accountOrigin, origin, originApi)
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
      balance: await getAssetBalance(accountOrigin, origin, currency),
      currency: asset?.symbol ?? ''
    },
    originFeeBalance: {
      balance: await getBalanceNative(accountOrigin, origin, originApi),
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
      maxNativeTransferableAmount: await getMaxNativeTransferableAmount(accountOrigin, origin)
    },
    destinationFeeBalance: {
      balance: await getBalanceNative(accountDestination, destination),
      currency: getNativeAssetSymbol(destination),
      existentialDeposit: getExistentialDeposit(destination)
    }
  }
}
