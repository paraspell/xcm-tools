import { getExistentialDeposit } from '@paraspell/assets'

import type { TVerifyEdOnDestinationOptions } from '../../../types'
import { validateAddress } from '../../../utils'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'

export const verifyEdOnDestinationInternal = async <TApi, TRes>({
  api,
  node,
  address,
  currency
}: TVerifyEdOnDestinationOptions<TApi, TRes>) => {
  validateAddress(address, node)

  const ed = getExistentialDeposit(node, currency)

  if (ed === null) {
    throw new Error(`Cannot get existential deposit for currency ${JSON.stringify(currency)}`)
  }

  const edBN = BigInt(ed)

  const balance = await getAssetBalanceInternal({
    address,
    node,
    api,
    currency
  })

  const originalAmount = BigInt(currency.amount)
  const fee = originalAmount / BigInt(100)
  const amountWithoutFee = originalAmount - fee

  return balance + amountWithoutFee - edBN > 0
}
