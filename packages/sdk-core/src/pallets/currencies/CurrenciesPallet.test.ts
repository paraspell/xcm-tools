import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertHasId } from '../../utils'
import { CurrenciesPallet } from './CurrenciesPallet'

vi.mock('../../utils')

describe('CurrenciesPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds update_balance with numeric currency_id from string assetId', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5FbrsAddr'
    const asset = { assetId: '45', amount: 999n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n)

    expect(vi.mocked(assertHasId)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(assertHasId)).toHaveBeenCalledWith(asset)
    expect(res.balanceTx.module).toBe('Currencies')
    expect(res.balanceTx.method).toBe('update_balance')
    expect(res.balanceTx.parameters.who).toBe(address)
    expect(typeof res.balanceTx.parameters.currency_id).toBe('number')
    expect(res.balanceTx.parameters.currency_id).toBe(45)
    expect(res.balanceTx.parameters.amount).toBe(999n)
  })

  it('builds update_balance with numeric currency_id from numeric assetId', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5FbrsAddr'
    const asset = { assetId: '7', amount: 1n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n)

    expect(res.balanceTx.parameters.who).toBe(address)
    expect(res.balanceTx.parameters.currency_id).toBe(7)
    expect(res.balanceTx.parameters.amount).toBe(1n)
  })

  it('throws when assertHasId fails', () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5FbrsAddr'
    const asset = { amount: 1n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {
      throw new Error('missing id')
    })

    expect(() => pallet.mint(address, asset, 0n)).toThrow('missing id')
  })
})
