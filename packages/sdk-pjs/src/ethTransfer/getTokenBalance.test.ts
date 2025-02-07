import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTokenBalance } from './getTokenBalance'
import { environment } from '@snowbridge/api'
import type { Signer } from 'ethers'
import type { WETH9 } from '@snowbridge/contract-types'
import { WETH9__factory } from '@snowbridge/contract-types'

describe('getTokenBalance', () => {
  const tokenSymbol = 'TEST'
  const tokenAddress = '0xTokenAddress'
  const fakeEnv = {
    name: 'polkadot_mainnet',
    ethChainId: 1,
    locations: [{ erc20tokensReceivable: [{ id: tokenSymbol, address: tokenAddress }] }],
    config: {}
  } as (typeof environment.SNOWBRIDGE_ENV)['polkadot_mainnet']

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(environment, 'SNOWBRIDGE_ENV', 'get').mockReturnValue({ polkadot_mainnet: fakeEnv })
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
    expect(spy).toHaveBeenCalledWith(tokenAddress, fakeSigner)
    expect(addressSpy).toHaveBeenCalled()
    expect(fakeWeth9.balanceOf).toHaveBeenCalledWith('0xSignerAddress')
    expect(result).toEqual(fakeBalance)
  })

  it('throws an error when the token is not supported', async () => {
    const fakeSigner = { getAddress: vi.fn() } as unknown as Signer
    const invalidSymbol = 'UNKNOWN'
    await expect(getTokenBalance(fakeSigner, invalidSymbol)).rejects.toThrow(
      `Token ${invalidSymbol} not supported`
    )
  })
})
