import { findAssetInfoOrThrow, InvalidAddressError, type TAssetInfo } from '@paraspell/sdk-core'
import type { BridgeInfo } from '@snowbridge/base-types'
import { bridgeInfoFor } from '@snowbridge/registry'
import { encodeFunctionData } from 'viem'
import { mainnet } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildApproveToken } from './buildApproveToken'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
}))

vi.mock('@snowbridge/registry')

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  encodeFunctionData: vi.fn().mockReturnValue('0xcalldata')
}))

const GATEWAY = '0x1111111111111111111111111111111111111111'
const ASSET_ID = '0x2222222222222222222222222222222222222222'

describe('buildApproveToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const asset: TAssetInfo = {
      symbol: 'WETH',
      decimals: 18,
      assetId: ASSET_ID,
      location: { parents: 0, interior: 'Here' }
    }
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { gatewayContract: GATEWAY }
    } as BridgeInfo)
    vi.mocked(encodeFunctionData).mockReturnValue('0xcalldata')
  })

  it('encodes an ERC-20 approve targeting the gateway contract', () => {
    const result = buildApproveToken('WETH', 1_000n)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Ethereum', { symbol: 'WETH' })
    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: expect.any(Array),
      functionName: 'approve',
      args: [GATEWAY, 1_000n]
    })
    expect(result).toEqual({
      type: 'eip1559',
      chainId: mainnet.id,
      to: ASSET_ID,
      data: '0xcalldata',
      value: 0n
    })
  })

  it('throws InvalidAddressError when the gateway contract is not a valid address', () => {
    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { gatewayContract: 'not-an-address' }
    } as BridgeInfo)

    expect(() => buildApproveToken('WETH', 1n)).toThrow(InvalidAddressError)
  })

  it('throws InvalidAddressError when the asset id is not a valid address', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'WETH',
      decimals: 18,
      assetId: 'not-address',
      location: { parents: 0, interior: 'Here' }
    })

    expect(() => buildApproveToken('WETH', 1n)).toThrow(InvalidAddressError)
  })
})
