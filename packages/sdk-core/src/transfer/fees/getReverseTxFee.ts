import type { TCurrencyInput, WithAmount } from '@paraspell/assets'
import { isChainEvm } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import { Builder } from '../../builder'
import type { TGetReverseTxFeeOptions } from '../../types'
import { padFee } from '../../utils/fees'

const determineAddress = (chain: TSubstrateChain, recipient: string, sender: string): string => {
  if (isChainEvm(chain)) {
    return isAddress(recipient) ? recipient : sender
  }
  return isAddress(recipient) ? sender : recipient
}

export const getReverseTxFee = async <TApi, TRes, TSigner>(
  {
    api,
    origin,
    destination,
    sender,
    recipient,
    skipReverseFeeCalculation
  }: TGetReverseTxFeeOptions<TApi, TRes, TSigner>,
  currencyInput: WithAmount<TCurrencyInput>
) => {
  if (skipReverseFeeCalculation) return 0n

  const toAddress = determineAddress(origin, recipient, sender)
  const fromAddress = determineAddress(destination, recipient, sender)

  const { tx } = await Builder(api)
    .from(destination)
    .to(origin)
    .sender(fromAddress)
    .recipient(toAddress)
    .currency(currencyInput)
    ['buildInternal']()

  const { partialFee } = await api.getPaymentInfo(tx, fromAddress)
  return padFee(partialFee, origin, destination, 'destination')
}
