import { findAssetInfoOrThrow, type TAssetInfo } from '@paraspell/sdk-core'
import type { WETH9 } from '@snowbridge/contract-types'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTokenBalance } from './getTokenBalance'

vi.mock('@paraspell/sdk-core')

describe('getTokenBalance', () => {
  const tokenSymbol = 'TEST'
  const tokenAddress = '0xTokenAddress'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: tokenSymbol,
      assetId: tokenAddress
    } as unknown as TAssetInfo)
  })

  it('calls balanceOf and returns the token balance', async () => {
    const fakeSigner = {
      getAddress: vi.fn().mockResolvedValue('0xSignerAddress')
    } as unknown as Signer
    const fakeBalance = 5000n
    const fakeWeth9 = {
      balanceOf: vi.fn().mockResolvedValue(fakeBalance)
    } as unknown as WETH9
    const spy = vi.spyOn(WETH9__factory, 'connect').mockReturnValue(fakeWeth9)
    const addressSpy = vi.spyOn(fakeSigner, 'getAddress')
    const result = await getTokenBalance(fakeSigner, tokenSymbol)
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Ethereum', { symbol: tokenSymbol }, null)
    expect(spy).toHaveBeenCalledWith(tokenAddress, fakeSigner)
    expect(addressSpy).toHaveBeenCalled()
    expect(fakeWeth9.balanceOf).toHaveBeenCalledWith('0xSignerAddress')
    expect(result).toEqual(fakeBalance)
  })
})
