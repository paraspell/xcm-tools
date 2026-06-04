import type { TEvmTransferOptions } from '@paraspell/sdk-core'
import { MissingParameterError, RoutingResolutionError } from '@paraspell/sdk-core'
import { createPublicClient, custom } from 'viem'

import { buildSnowbridgeTransfer } from './buildSnowbridgeTransfer'

export const executeEvmSnowbridgeTransfer = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>({
  api,
  signer,
  recipient,
  to,
  currency
}: TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>): Promise<string> => {
  const publicClient = createPublicClient({
    transport: custom(signer.transport),
    chain: signer.chain
  })

  const account = signer.account ?? (await signer.getAddresses())[0]
  if (!account) {
    throw new MissingParameterError(
      'signer.account',
      'viem WalletClient must have an account configured.'
    )
  }
  const sourceAddress = typeof account === 'string' ? account : account.address

  const { tx, sender } = await buildSnowbridgeTransfer(
    {
      api,
      from: 'Ethereum',
      to,
      currency,
      recipient,
      sender: sourceAddress
    },
    publicClient
  )

  const hash = await signer.sendTransaction({
    ...tx,
    chain: signer.chain,
    account
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new RoutingResolutionError(`Transaction ${hash} not included.`)
  }

  const messageReceipt = await sender.messageId(receipt)
  if (!messageReceipt) {
    throw new RoutingResolutionError(`Transaction ${hash} did not emit a message.`)
  }

  return hash
}
