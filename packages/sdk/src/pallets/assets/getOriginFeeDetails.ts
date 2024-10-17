import type { TCurrencyCore, TOriginFeeDetails } from '../../types'
import { type TNodeDotKsmWithRelayChains, type TNode, type TNodeWithRelayChains } from '../../types'
import { getBalanceNative } from './balance/getBalanceNative'
import { getMinNativeTransferableAmount } from './getExistentialDeposit'
import { isRelayChain } from '../../utils'
import { Builder } from '../../builder'
import type { IPolkadotApi } from '../../api/IPolkadotApi'

const createTx = async <TApi, TRes>(
  originApi: IPolkadotApi<TApi, TRes>,
  address: string,
  amount: string,
  currency: TCurrencyCore,
  originNode: TNodeWithRelayChains,
  destNode: TNodeWithRelayChains
): Promise<TRes> => {
  if (isRelayChain(originNode)) {
    return await Builder<TApi, TRes>(originApi)
      .to(destNode as TNode)
      .amount(amount)
      .address(address)
      .build()
  } else if (isRelayChain(destNode)) {
    return await Builder<TApi, TRes>(originApi)
      .from(originNode as TNode)
      .amount(amount)
      .address(address)
      .build()
  } else {
    return await Builder<TApi, TRes>(originApi)
      .from(originNode as TNode)
      .to(destNode as TNode)
      .currency(currency)
      .amount(amount)
      .address(address)
      .build()
  }
}

export const getOriginFeeDetails = async <TApi, TRes>(
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeDotKsmWithRelayChains,
  currency: TCurrencyCore,
  amount: string,
  account: string,
  api: IPolkadotApi<TApi, TRes>,
  feeMarginPercentage: number = 10
): Promise<TOriginFeeDetails> => {
  const nativeBalance = await getBalanceNative({
    address: account,
    node: origin,
    api
  })

  const minTransferableAmount = getMinNativeTransferableAmount(origin)

  const tx = await createTx(api, account, amount, currency, origin, destination)

  const xcmFee = await api.calculateTransactionFee(tx, account)

  const xcmFeeWithMargin = xcmFee + xcmFee / BigInt(feeMarginPercentage)

  const sufficientForXCM = nativeBalance - minTransferableAmount - xcmFeeWithMargin > 0

  return {
    sufficientForXCM,
    xcmFee
  }
}
