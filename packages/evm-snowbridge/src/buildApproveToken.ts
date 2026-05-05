import { assertEvmAddress, assertHasId, findAssetInfoOrThrow } from '@paraspell/sdk-core'
import { IERC20_ABI } from '@snowbridge/base-types'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { TransactionSerializableEIP1559 } from 'viem'
import { encodeFunctionData } from 'viem'
import { mainnet } from 'viem/chains'

export const buildApproveToken = (
  symbol: string,
  amount: bigint
): TransactionSerializableEIP1559 => {
  const asset = findAssetInfoOrThrow('Ethereum', { symbol })
  assertHasId(asset)

  const {
    environment: { gatewayContract }
  } = bridgeInfoFor('polkadot_mainnet')

  assertEvmAddress(gatewayContract)
  assertEvmAddress(asset.assetId)

  const data = encodeFunctionData({
    abi: IERC20_ABI,
    functionName: 'approve',
    args: [gatewayContract, amount]
  })

  return { type: 'eip1559', chainId: mainnet.id, to: asset.assetId, data, value: 0n }
}
