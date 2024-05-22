import { type TNodeWithRelayChains } from '../../types'
import { createApiInstanceForNode } from '../../utils'
import { getBalanceNative } from './getBalanceNative'
import {
  type TTransferableAmountResult,
  getExistentialDeposit,
  getMaxNativeTransferableAmount,
  getMinNativeTransferableAmount
} from './getExistentialDeposit'
import { type TOriginFeeDetails, getOriginFeeDetails } from './getOriginFeeDetails'

interface TTransferInfo {
  balanceOrigin: bigint
  destinationFeeBalance: bigint
  expectedBalanceAfterXCMDelivery: bigint
  xcmFee: TOriginFeeDetails
  existentialDepositOrigin: bigint | null
  existentialDepositDestination: bigint | null
  minNativeTransferableAmount: TTransferableAmountResult
  maxNativeTransferableAmount?: TTransferableAmountResult
}

export const getTransferInfo = async (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains,
  accountOrigin: string,
  accountDestination: string,
  assetSymbolOrId: string,
  amount: string
): Promise<TTransferInfo> => {
  const originApi = await createApiInstanceForNode(origin)
  const destApi = await createApiInstanceForNode(destination)
  const destinationFeeBalance = await getBalanceNative(accountDestination, destination, destApi)
  const { xcmFee: destXcmFee } = await getOriginFeeDetails(
    destination,
    origin,
    assetSymbolOrId,
    amount,
    accountDestination,
    destApi
  )
  const expectedBalanceAfterXCMDelivery = destinationFeeBalance - destXcmFee
  return {
    balanceOrigin: await getBalanceNative(accountOrigin, origin, originApi),
    destinationFeeBalance: await getBalanceNative(accountDestination, destination, destApi),
    expectedBalanceAfterXCMDelivery,
    xcmFee: await getOriginFeeDetails(
      origin,
      destination,
      assetSymbolOrId,
      amount,
      accountOrigin,
      originApi
    ),
    existentialDepositOrigin: BigInt(getExistentialDeposit(origin) ?? 0),
    existentialDepositDestination: BigInt(getExistentialDeposit(destination) ?? 0),
    minNativeTransferableAmount: getMinNativeTransferableAmount(origin),
    maxNativeTransferableAmount: await getMaxNativeTransferableAmount(accountOrigin, origin)
  }
}
