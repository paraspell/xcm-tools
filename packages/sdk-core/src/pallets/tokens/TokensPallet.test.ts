import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertHasId, getChain } from '../../utils'
import { TokensPallet } from './TokensPallet'

vi.mock('../../utils', () => {
  const selectionValue = { Token: 'BNC' }
  return {
    assertHasId: vi.fn(),
    getChain: vi.fn(() => ({
      getCurrencySelection: (_asset: unknown) => selectionValue
    }))
  }
})

describe('TokensPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('non-Bifrost: uses assetId, calls assertHasId twice, formats tx correctly', async () => {
    const pallet = new TokensPallet('Tokens')
    const address = 'Alice'
    const chain = 'Acala' as TSubstrateChain
    const asset = { assetId: '123', amount: 777n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(vi.mocked(assertHasId)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(getChain)).not.toHaveBeenCalled()

    expect(res.balanceTx.module).toBe('Tokens')
    expect(res.balanceTx.method).toBe('set_balance')
    expect(res.balanceTx.parameters).toEqual({
      who: { Id: address },
      currency_id: '123',
      new_free: 777n,
      new_reserved: 0n
    })
  })

  it('Bifrost: uses getCurrencySelection and does not call assertHasId', async () => {
    const pallet = new TokensPallet('Tokens')
    const address = 'Alice'
    const chain = 'BifrostKusama' as TSubstrateChain
    const asset = { amount: 5n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(vi.mocked(assertHasId)).not.toHaveBeenCalled()
    expect(vi.mocked(getChain)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getChain)).toHaveBeenCalledWith('BifrostPolkadot')

    expect(res.balanceTx.parameters.who).toEqual({ Id: address })
    expect(res.balanceTx.parameters.currency_id).toEqual({ Token: 'BNC' })
    expect(res.balanceTx.parameters.new_free).toBe(5n)
    expect(res.balanceTx.parameters.new_reserved).toBe(0n)
  })
})
