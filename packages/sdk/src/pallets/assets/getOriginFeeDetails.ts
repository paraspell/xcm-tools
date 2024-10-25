import type { TCurrencyCore, TOriginFeeDetails } from '../../types'
import {
  type TNodeDotKsmWithRelayChains,
  type Extrinsic,
  type TNode,
  type TNodeWithRelayChains
} from '../../types'
import { getBalanceNative } from './balance/getBalanceNative'
import { getMinNativeTransferableAmount } from './getExistentialDeposit'
import { type ApiPromise } from '@polkadot/api'
import { createApiInstanceForNode, isRelayChain } from '../../utils'
import { Builder } from '../../builder'
import { calculateTransactionFee } from '../xcmPallet/calculateTransactionFee'

const createTx = async (
  originApi: ApiPromise,
  address: string,
  amount: string,
  currency: TCurrencyCore,
  originNode: TNodeWithRelayChains,
  destNode: TNodeWithRelayChains
): Promise<Extrinsic> => {
  if (isRelayChain(originNode)) {
    return await Builder(originApi)
      .to(destNode as TNode)
      .amount(amount)
      .address(address)
      .build()
  } else if (isRelayChain(destNode)) {
    return await Builder(originApi)
      .from(originNode as TNode)
      .amount(amount)
      .address(address)
      .build()
  } else {
    return await Builder(originApi)
      .from(originNode as TNode)
      .to(destNode as TNode)
      .currency(currency)
      .amount(amount)
      .address(address)
      .build()
  }
}

export const getOriginFeeDetails = async (
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeDotKsmWithRelayChains,
  currency: TCurrencyCore,
  amount: string,
  account: string,
  api?: ApiPromise,
  feeMarginPercentage: number = 10
): Promise<TOriginFeeDetails> => {
  const nativeBalance = await getBalanceNative(account, origin)

  const minTransferableAmount = getMinNativeTransferableAmount(origin)

  const apiWithFallback = api ?? (await createApiInstanceForNode(origin))
  const tx = await createTx(apiWithFallback, account, amount, currency, origin, destination)
  const xcmFee = await calculateTransactionFee(tx, account)

  const xcmFeeBigInt = BigInt(xcmFee.toString())
  const xcmFeeWithMargin = xcmFeeBigInt + xcmFeeBigInt / BigInt(feeMarginPercentage)

  const sufficientForXCM = nativeBalance - minTransferableAmount - xcmFeeWithMargin > 0

  return {
    sufficientForXCM,
    xcmFee: xcmFeeBigInt
  }
}
