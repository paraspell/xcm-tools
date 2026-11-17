import type { TCurrencyInput, WithAmount } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { PolkadotApi } from '../../api'
import { Builder } from '../../builder'
import type { TGetReverseTxFeeOptions } from '../../types'
import { padFee } from '../../utils/fees'

const determineAddress = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TChain | TCustomChain,
  recipient: string,
  sender: string
): string => {
  if (api.isChainEvm(chain)) {
    return isAddress(recipient) ? recipient : sender
  }
  return isAddress(recipient) ? sender : recipient
}

export const getReverseTxFee = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  {
    api,
    origin,
    destination,
    sender,
    recipient,
    skipReverseFeeCalculation
  }: TGetReverseTxFeeOptions<TApi, TRes, TSigner, TCustomChain>,
  currencyInput: WithAmount<TCurrencyInput>
) => {
  if (skipReverseFeeCalculation) return 0n

  const toAddress = determineAddress(api, origin, recipient, sender)
  const fromAddress = determineAddress(api, destination, recipient, sender)

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
