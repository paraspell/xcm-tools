import type { TCurrencyInput } from '@paraspell/assets'
import { isChainEvm } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import { Builder } from '../../builder'
import type { TGetReverseTxFeeOptions } from '../../types'
import { padFee } from './padFee'

const determineAddress = (
  chain: TSubstrateChain,
  address: string,
  senderAddress: string
): string => {
  if (isChainEvm(chain)) {
    return isAddress(address) ? address : senderAddress
  }
  return isAddress(address) ? senderAddress : address
}

export const getReverseTxFee = async <TApi, TRes>(
  {
    api,
    origin,
    destination,
    senderAddress,
    address,
    currency
  }: TGetReverseTxFeeOptions<TApi, TRes>,
  currencyInput: TCurrencyInput
) => {
  const toAddress = determineAddress(origin, address, senderAddress)
  const fromAddress = determineAddress(destination, address, senderAddress)

  const tx = await Builder(api)
    .from(destination)
    .to(origin)
    .address(toAddress)
    .senderAddress(fromAddress)
    .currency({ ...currencyInput, amount: currency.amount })
    .build()

  const rawFee = await api.calculateTransactionFee(tx, fromAddress)
  return padFee(rawFee, origin, destination, 'destination')
}
