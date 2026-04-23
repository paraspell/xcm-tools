import {
  assertHasId,
  findAssetInfoOrThrow,
  InvalidAddressError,
  MissingParameterError
} from '@paraspell/sdk-core'
import { IERC20_ABI } from '@snowbridge/base-types'
import { bridgeInfoFor } from '@snowbridge/registry'
import { type Hash, isAddress, type WalletClient } from 'viem'

export const approveToken = async (
  signer: WalletClient,
  amount: bigint,
  symbol: string
): Promise<Hash> => {
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

  if (!isAddress(gatewayContract)) throw new InvalidAddressError(gatewayContract)
  if (!isAddress(asset.assetId)) throw new InvalidAddressError(asset.assetId)

  return signer.writeContract({
    address: asset.assetId,
    abi: IERC20_ABI,
    functionName: 'approve',
    args: [gatewayContract, amount],
    account,
    chain: signer.chain ?? null
  })
}
