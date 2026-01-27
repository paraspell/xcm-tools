import { assertHasId, findAssetInfoOrThrow } from '@paraspell/sdk-core'
import { WETH9__factory } from '@snowbridge/contract-types'
import { environmentFor } from '@snowbridge/registry'
import type { Signer } from 'ethers'

export const approveToken = async (signer: Signer, amount: bigint, symbol: string) => {
  const { gatewayContract } = environmentFor('polkadot_mainnet')

  const asset = findAssetInfoOrThrow('Ethereum', { symbol }, null)

  assertHasId(asset)

  const weth9 = WETH9__factory.connect(asset.assetId, signer)
  const result = await weth9.approve(gatewayContract, amount)
  const receipt = await result.wait()

  return { result, receipt }
}
