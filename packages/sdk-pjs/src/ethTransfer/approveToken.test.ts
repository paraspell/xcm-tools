import type { TAssetInfo } from '@paraspell/sdk-core'
import { findAssetInfoOrThrow } from '@paraspell/sdk-core'
import type { BridgeInfo } from '@snowbridge/base-types'
import type { WETH9 } from '@snowbridge/contract-types'
import { WETH9__factory } from '@snowbridge/contract-types'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { Signer } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { approveToken } from './approveToken'

vi.mock('@snowbridge/registry')
vi.mock('@paraspell/sdk-core')

describe('approveToken', () => {
  const tokenSymbol = 'TEST'
  const tokenAddress = '0xTokenAddress'
  const gatewayAddress = '0xGatewayAddress'
  const amount = 1000n

  const fakeEnv = {
    environment: {
      gatewayContract: gatewayAddress
    }
  } as BridgeInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bridgeInfoFor).mockReturnValue(fakeEnv)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: tokenSymbol,
      assetId: tokenAddress
    } as TAssetInfo)
  })

  it('calls approve and returns the result and receipt', async () => {
    const fakeSigner = {} as Signer
    const fakeReceipt = { txHash: '0xabc' }
    const fakeWait = vi.fn().mockResolvedValue(fakeReceipt)
    const fakeResult = { wait: fakeWait }
    const fakeContractInstance = {
      approve: vi.fn().mockResolvedValue(fakeResult)
    } as unknown as WETH9
    const spy = vi.spyOn(WETH9__factory, 'connect').mockReturnValue(fakeContractInstance)
    const result = await approveToken(fakeSigner, amount, tokenSymbol)
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Ethereum', { symbol: tokenSymbol }, null)
    expect(spy).toHaveBeenCalledWith(tokenAddress, fakeSigner)
    expect(fakeContractInstance.approve).toHaveBeenCalledWith(gatewayAddress, amount)
    expect(fakeWait).toHaveBeenCalled()
    expect(result).toEqual({ result: fakeResult, receipt: fakeReceipt })
  })
})
