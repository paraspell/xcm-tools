import type { TCurrencyInput } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'

import { Builder } from '../../builder'
import type { TGetFeeForDestNodeOptions } from '../../types'
import { padFee } from './padFee'

export const getReverseTxFee = async <TApi, TRes>(
  {
    api,
    origin,
    destination,
    senderAddress,
    address,
    currency
  }: TGetFeeForDestNodeOptions<TApi, TRes>,
  currencyInput: TCurrencyInput
) => {
  if ('multiasset' in currency) {
    throw new InvalidCurrencyError('Multi-assets are not yet supported for XCM fee calculation.')
  }

  const tx = await Builder(api)
    .from(destination)
    .to(origin)
    .address(senderAddress)
    .senderAddress(address)
    .currency({ ...currencyInput, amount: currency.amount })
    .build()

  const rawFee = await api.calculateTransactionFee(tx, address)
  return padFee(rawFee, origin, destination, 'destination')
}
