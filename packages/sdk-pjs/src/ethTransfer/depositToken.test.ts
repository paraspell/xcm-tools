import { describe, it, expect, vi, beforeEach } from 'vitest'
import { depositToken } from './depositToken'
import { environment } from '@snowbridge/api'
import type { WETH9 } from '@snowbridge/contract-types'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'

describe('depositToken', () => {
  const tokenSymbol = 'TEST'
  const tokenAddress = '0xTokenAddress'
  const amount = 1000n

  const fakeEnv = {
    name: 'polkadot_mainnet',
    ethChainId: 1,
    locations: [
      {
        erc20tokensReceivable: [{ id: tokenSymbol, address: tokenAddress }]
      }
    ],
    config: {}
  } as (typeof environment.SNOWBRIDGE_ENV)['polkadot_mainnet']

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(environment, 'SNOWBRIDGE_ENV', 'get').mockReturnValue({ polkadot_mainnet: fakeEnv })
  })

  it('calls deposit and returns the result and receipt', async () => {
    const fakeSigner = {} as Signer
    const fakeReceipt = { txHash: '0xabc' }
    const fakeWait = vi.fn().mockResolvedValue(fakeReceipt)
    const fakeResult = { wait: fakeWait }
    const fakeContractInstance = {
      deposit: vi.fn().mockResolvedValue(fakeResult)
    } as unknown as WETH9
    const spy = vi.spyOn(WETH9__factory, 'connect').mockReturnValue(fakeContractInstance)
    const result = await depositToken(fakeSigner, amount, tokenSymbol)
    expect(spy).toHaveBeenCalledWith(tokenAddress, fakeSigner)
    expect(fakeContractInstance.deposit).toHaveBeenCalledWith({ value: amount })
    expect(fakeWait).toHaveBeenCalled()
    expect(result).toEqual({ result: fakeResult, receipt: fakeReceipt })
  })

  it('throws an error when the token is not supported', async () => {
    const fakeSigner = {} as Signer
    const invalidSymbol = 'UNKNOWN'
    await expect(depositToken(fakeSigner, amount, invalidSymbol)).rejects.toThrow(
      `Token ${invalidSymbol} not supported`
    )
  })
})
