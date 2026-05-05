import type { TAssetInfo, TChain, WithAmount } from '@paraspell/sdk-core'
import { assertEvmAddress, assertHasId } from '@paraspell/sdk-core'
import type { TransactionSerializableEIP1559 } from 'viem'
import { encodeFunctionData } from 'viem'

import { getViemChain } from '../chains'

const abi = [
  {
    inputs: [
      { internalType: 'address', name: 'recipient_', type: 'address' },
      { internalType: 'uint256', name: 'amount_', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export const buildMoonbeamLocal = (
  from: TChain,
  assetInfo: WithAmount<TAssetInfo>,
  recipient: string
): TransactionSerializableEIP1559 => {
  assertHasId(assetInfo)
  assertEvmAddress(recipient)
  assertEvmAddress(assetInfo.assetId)

  const data = encodeFunctionData({
    abi,
    functionName: 'transfer',
    args: [recipient, assetInfo.amount]
  })

  return {
    type: 'eip1559',
    chainId: getViemChain(from).id,
    to: assetInfo.assetId,
    data,
    value: 0n
  }
}
