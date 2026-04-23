import type { TAssetInfo, WithAmount } from '@paraspell/sdk-core'
import { assertHasId, type TEvmTransferOptions } from '@paraspell/sdk-core'
import type { Address, createPublicClient } from 'viem'
import { getContract } from 'viem'

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
  { signer, recipient }: TEvmTransferOptions<TApi, TRes, TSigner>
): Promise<string> => {
  assertHasId(assetInfo)

  const contract = getContract({
    abi,
    address: assetInfo.assetId as Address,
    client: {
      public: client,
      wallet: signer
    }
  })

  return contract.write.transfer([recipient as Address, assetInfo.amount])
}
