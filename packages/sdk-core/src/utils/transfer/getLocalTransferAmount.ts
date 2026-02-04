import { getEdFromAssetOrThrow } from '@paraspell/assets'

import { AmountTooLowError } from '../../errors'
import type { TTransferLocalOptions } from '../../types'

export const getLocalTransferAmount = <TApi, TRes, TSigner>(
  { assetInfo, balance, isAmountAll, keepAlive }: TTransferLocalOptions<TApi, TRes, TSigner>,
  fee = 0n
): bigint => {
  const ed = getEdFromAssetOrThrow(assetInfo)
  const { amount } = assetInfo

  const freeBalance = balance > fee ? balance - fee : 0n

  if (isAmountAll) {
    return keepAlive ? (freeBalance > ed ? freeBalance - ed : 0n) : freeBalance
  }

  if (keepAlive && freeBalance - amount < ed) {
    throw new AmountTooLowError('Transaction would violate Keep Alive (remaining balance < ED)')
  }

  return amount
}
