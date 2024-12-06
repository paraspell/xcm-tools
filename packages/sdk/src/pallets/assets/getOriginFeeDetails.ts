import type { TCurrencyCore, TNodePolkadotKusama, TOriginFeeDetails } from '../../types'
import { type TNodeDotKsmWithRelayChains } from '../../types'
import { getBalanceNativeInternal } from './balance/getBalanceNative'
import { isRelayChain } from '../../utils'
import { Builder } from '../../builder'
import type { IPolkadotApi } from '../../api/IPolkadotApi'
import type { TGetOriginFeeDetailsOptions } from '../../types/TBalance'
import { getExistentialDeposit } from './assets'

const createTx = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: string,
  amount: string,
  currency: TCurrencyCore,
  originNode: TNodeDotKsmWithRelayChains,
  destNode: TNodeDotKsmWithRelayChains
): Promise<TRes> => {
  if (isRelayChain(originNode)) {
    return Builder<TApi, TRes>(api)
      .to(destNode as TNodePolkadotKusama)
      .amount(amount)
      .address(address)
      .build()
  } else if (isRelayChain(destNode)) {
    return Builder<TApi, TRes>(api)
      .from(originNode as TNodePolkadotKusama)
      .amount(amount)
      .address(address)
      .build()
  } else {
    return Builder<TApi, TRes>(api)
      .from(originNode as TNodePolkadotKusama)
      .to(destNode as TNodePolkadotKusama)
      .currency(currency)
      .amount(amount)
      .address(address)
      .build()
  }
}

export const getOriginFeeDetailsInternal = async <TApi, TRes>({
  api,
  account,
  accountDestination,
  amount,
  currency,
  origin: origin,
  destination,
  feeMarginPercentage = 10
}: TGetOriginFeeDetailsOptions<TApi, TRes>): Promise<TOriginFeeDetails> => {
  await api.init(origin)

  const tx = await createTx(api, accountDestination, amount, currency, origin, destination)

  const xcmFee = await api.calculateTransactionFee(tx, account)
  const xcmFeeWithMargin = xcmFee + xcmFee / BigInt(feeMarginPercentage)

  const nativeBalance = await getBalanceNativeInternal({
    address: account,
    node: origin,
    api
  })

  const existentialDeposit = BigInt(getExistentialDeposit(origin) ?? '0')
  const sufficientForXCM = nativeBalance - existentialDeposit - xcmFeeWithMargin > 0

  return {
    sufficientForXCM,
    xcmFee
  }
}

export const getOriginFeeDetails = async <TApi, TRes>(
  options: TGetOriginFeeDetailsOptions<TApi, TRes>
): Promise<TOriginFeeDetails> => {
  const { api } = options
  api.setDisconnectAllowed(false)
  try {
    return await getOriginFeeDetailsInternal(options)
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
