import type { TEvmTransferOptions } from '@paraspell/sdk-core'
import { MissingParameterError } from '@paraspell/sdk-core'

import { buildEvmTransfer } from './buildEvmTransfer'

export const executeEvmTransfer = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<string> => {
  const { signer } = options
  const account = signer.account
  if (!account) {
    throw new MissingParameterError(
      'signer.account',
      'viem WalletClient must have an account configured.'
    )
  }
  const sender = account.address

  const tx = await buildEvmTransfer({ ...options, sender })

  return signer.sendTransaction({
    ...tx,
    chain: signer.chain,
    account
  })
}
