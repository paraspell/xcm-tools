import { type BN } from '@polkadot/util'
import {
  type TNodeDotKsmWithRelayChains,
  type Extrinsic,
  type TNode,
  type TNodeWithRelayChains,
  TCurrencyCore
} from '../../types'
import { getBalanceNative } from './balance/getBalanceNative'
import { getMinNativeTransferableAmount } from './getExistentialDeposit'
import { type ApiPromise } from '@polkadot/api'
import { createApiInstanceForNode, isRelayChain } from '../../utils'
import { Builder } from '../../builder'

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

const calculateTransactionFee = async (tx: Extrinsic, address: string): Promise<BN> => {
  const { partialFee } = await tx.paymentInfo(address)
  return partialFee.toBn()
}

interface TOriginFeeDetails {
  sufficientForXCM: boolean
  xcmFee: bigint
}

export const getOriginFeeDetails = async (
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeDotKsmWithRelayChains,
  currency: TCurrencyCore,
  amount: string,
  account: string,
  api?: ApiPromise
): Promise<TOriginFeeDetails> => {
  const nativeBalance = await getBalanceNative(account, origin)

  const minTransferableAmount = getMinNativeTransferableAmount(origin)

  const apiWithFallback = api ?? (await createApiInstanceForNode(origin))
  const tx = await createTx(apiWithFallback, account, amount, currency, origin, destination)
  const xcmFee = await calculateTransactionFee(tx, account)

  const xcmFeeBigInt = BigInt(xcmFee.toString())
  const xcmFeeWithMargin = xcmFeeBigInt + xcmFeeBigInt / BigInt(10)

  console.log('nativeBalance', nativeBalance)
  console.log('minTransferableAmount', minTransferableAmount)
  console.log('xcmFeeBigInt', xcmFeeBigInt)
  console.log('xcmFeeWithMargin', xcmFeeWithMargin)

  const sufficientForXCM = nativeBalance - minTransferableAmount - xcmFeeWithMargin > 0

  return {
    sufficientForXCM,
    xcmFee: xcmFeeBigInt
  }
}
