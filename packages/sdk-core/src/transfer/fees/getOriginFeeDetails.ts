import { getExistentialDeposit } from '@paraspell/assets'

import { getBalanceNative } from '../../balance'
import { Builder } from '../../builder'
import type { TOriginFeeDetails } from '../../types'
import type { TGetOriginFeeDetailsOptions } from '../../types/TBalance'

export const getOriginFeeDetailsInternal = async <TApi, TRes>({
  api,
  account,
  accountDestination,
  ahAddress,
  currency,
  origin,
  destination,
  feeMarginPercentage = 10
}: TGetOriginFeeDetailsOptions<TApi, TRes>): Promise<TOriginFeeDetails> => {
  await api.init(origin)

  const { tx } = await Builder(api)
    .from(origin)
    .to(destination)
    .currency(currency)
    .address(accountDestination)
    .senderAddress(account)
    .ahAddress(ahAddress)
    ['buildInternal']()

  const xcmFee = await api.calculateTransactionFee(tx, account)
  const xcmFeeWithMargin = xcmFee + xcmFee / BigInt(feeMarginPercentage)

  const nativeBalance = await getBalanceNative({
    address: account,
    chain: origin,
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
