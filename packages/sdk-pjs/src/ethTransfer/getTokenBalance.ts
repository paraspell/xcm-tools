import { assertHasId, findAssetInfoOrThrow } from '@paraspell/sdk-core'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'

export const getTokenBalance = async (signer: Signer, symbol: string) => {
  const asset = findAssetInfoOrThrow('Ethereum', { symbol }, null)

  assertHasId(asset)

  const weth9 = WETH9__factory.connect(asset.assetId, signer)
  const address = await signer.getAddress()
  return weth9.balanceOf(address)
}
