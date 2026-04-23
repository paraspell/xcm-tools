import { assertHasId, findAssetInfoOrThrow, MissingParameterError } from '@paraspell/sdk-core'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { WalletClient } from 'viem'
import { createPublicClient, custom, maxUint128 } from 'viem'

export const getTokenBalance = async (
  signer: WalletClient,
  symbol: string
): Promise<{ balance: bigint; gatewayAllowance: bigint }> => {
  const asset = findAssetInfoOrThrow('Ethereum', { symbol })
  assertHasId(asset)

  const {
    environment: { gatewayContract }
  } = bridgeInfoFor('polkadot_mainnet')

  const account = signer.account ?? (await signer.getAddresses())[0]
  if (!account) {
    throw new MissingParameterError(
      'signer.account',
      'viem WalletClient must have an account configured.'
    )
  }
  const ownerAddress = typeof account === 'string' ? account : account.address

  const publicClient = createPublicClient({
    transport: custom(signer.transport),
    chain: signer.chain
  })

  const { assetId } = findAssetInfoOrThrow('Ethereum', { symbol: 'ETH' })

  if (asset.assetId.toLowerCase() === assetId?.toLowerCase()) {
    const balance = await publicClient.getBalance({
      address: ownerAddress
    })
    return { balance, gatewayAllowance: maxUint128 }
  }

  return new ViemEthereumProvider().erc20Balance(
    publicClient,
    asset.assetId,
    ownerAddress,
    gatewayContract
  )
}
