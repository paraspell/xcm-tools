import type { TOriginFeeDetails } from '../../types'
import { getBalanceNativeInternal } from './balance/getBalanceNative'
import { Builder } from '../../builder'
import type { TGetOriginFeeDetailsOptions } from '../../types/TBalance'
import { getExistentialDeposit } from './assets'

export const getOriginFeeDetailsInternal = async <TApi, TRes>({
  api,
  account,
  accountDestination,
  ahAccount,
  currency,
  origin,
  destination,
  feeMarginPercentage = 10
}: TGetOriginFeeDetailsOptions<TApi, TRes>): Promise<TOriginFeeDetails> => {
  await api.init(origin)

  const tx = await Builder<TApi, TRes>(api)
    .from(origin)
    .to(destination)
    .currency(currency)
    .address(accountDestination, ahAccount)
    .build()

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
