import { assertHasId, findAssetInfoOrThrow } from '@paraspell/sdk-core'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'

export const depositToken = async (signer: Signer, amount: bigint, symbol: string) => {
  const asset = findAssetInfoOrThrow('Ethereum', { symbol }, null)

  assertHasId(asset)

  const weth9 = WETH9__factory.connect(asset.assetId, signer)
  const result = await weth9.deposit({ value: amount })
  const receipt = await result.wait()

  return { result, receipt }
}
