import { MissingParameterError } from '@paraspell/sdk-core'
import type { Hash, WalletClient } from 'viem'

import { buildApproveToken } from './buildApproveToken'

export const approveToken = async (
  signer: WalletClient,
  amount: bigint,
  symbol: string
): Promise<Hash> => {
  const account = signer.account ?? (await signer.getAddresses())[0]
  if (!account) {
    throw new MissingParameterError(
      'signer.account',
      'viem WalletClient must have an account configured.'
    )
  }

  const tx = buildApproveToken(symbol, amount)

  return signer.sendTransaction({
    ...tx,
    account,
    chain: signer.chain
  })
}
