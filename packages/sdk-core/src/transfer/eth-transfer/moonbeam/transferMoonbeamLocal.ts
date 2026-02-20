import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { createPublicClient } from 'viem'
import { getContract } from 'viem'

import type { TEvmBuilderOptions } from '../../../types'
import { assertHasId } from '../../../utils'

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient_',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount_',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export const transferMoonbeamLocal = async <TApi, TRes, TSigner>(
  client: ReturnType<typeof createPublicClient>,
  assetInfo: WithAmount<TAssetInfo>,
  { signer, address }: TEvmBuilderOptions<TApi, TRes, TSigner>
): Promise<string> => {
  assertHasId(assetInfo)

  const contract = getContract({
    abi,
    address: assetInfo.assetId as `0x${string}`,
    client: {
      public: client,
      wallet: signer
    }
  })

  return contract.write.transfer([address as `0x${string}`, assetInfo.amount])
}
