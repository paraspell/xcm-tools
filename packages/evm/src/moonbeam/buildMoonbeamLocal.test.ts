import type { TAssetInfo, WithAmount } from '@paraspell/sdk-core'
import { encodeFunctionData } from 'viem'
import { moonbeam } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildMoonbeamLocal } from './buildMoonbeamLocal'

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  encodeFunctionData: vi.fn().mockReturnValue('0xencoded')
}))

describe('buildMoonbeamLocal', () => {
  const recipient = '0x1111111111111111111111111111111111111111'
  const assetAddress = '0xffffffff1fcacbd218edc0eba20fc2308c778080'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(encodeFunctionData).mockReturnValue('0xencoded')
  })

  it('builds an EIP-1559 tx targeting the asset contract with transfer calldata', () => {
    const assetInfo: WithAmount<TAssetInfo> = {
      symbol: 'xcDOT',
      assetId: assetAddress,
      decimals: 10,
      location: { parents: 1, interior: 'Here' },
      amount: 5000000n
    }

    const tx = buildMoonbeamLocal('Moonbeam', assetInfo, recipient)

    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: expect.any(Array),
      functionName: 'transfer',
      args: [recipient, 5000000n]
    })
    expect(tx).toEqual({
      type: 'eip1559',
      chainId: moonbeam.id,
      to: assetAddress,
      data: '0xencoded',
      value: 0n
    })
  })

  it('throws InvalidAddressError when recipient is not a valid EVM address', () => {
    const assetInfo: WithAmount<TAssetInfo> = {
      symbol: 'xcDOT',
      assetId: assetAddress,
      decimals: 10,
      location: { parents: 1, interior: 'Here' },
      amount: 5000000n
    }

    expect(() => buildMoonbeamLocal('Moonbeam', assetInfo, 'not-an-address')).toThrow()
  })
})
