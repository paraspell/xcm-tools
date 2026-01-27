import type { TAssetInfo } from '@paraspell/sdk-core'
import { findAssetInfoOrThrow } from '@paraspell/sdk-core'
import type { WETH9 } from '@snowbridge/contract-types'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { depositToken } from './depositToken'

vi.mock('@paraspell/sdk-core')

describe('depositToken', () => {
  const tokenSymbol = 'TEST'
  const tokenAddress = '0xTokenAddress'
  const amount = 1000n

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: tokenSymbol,
      assetId: tokenAddress
    } as unknown as TAssetInfo)
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
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Ethereum', { symbol: tokenSymbol }, null)
    expect(spy).toHaveBeenCalledWith(tokenAddress, fakeSigner)
    expect(fakeContractInstance.deposit).toHaveBeenCalledWith({ value: amount })
    expect(fakeWait).toHaveBeenCalled()
    expect(result).toEqual({ result: fakeResult, receipt: fakeReceipt })
  })
})
