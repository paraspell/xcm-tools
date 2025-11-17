import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type BifrostPolkadot from '../../chains/supported/BifrostPolkadot'
import { assertHasId, getChain } from '../../utils'
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

    const res = await pallet.mint(address, asset, 0n, 'Hydration')

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(assertHasId).toHaveBeenCalledWith(asset)
    expect(res.balanceTx.module).toBe('Currencies')
    expect(res.balanceTx.method).toBe('update_balance')
    expect(res.balanceTx.params.who).toBe(address)
    expect(typeof res.balanceTx.params.currency_id).toBe('number')
    expect(res.balanceTx.params.currency_id).toBe(45)
    expect(res.balanceTx.params.amount).toBe(999n)
  })

  it('builds update_balance with numeric currency_id from numeric assetId', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5FbrsAddr'
    const asset = { assetId: '7', amount: 1n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n, 'Hydration')

    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.currency_id).toBe(7)
    expect(res.balanceTx.params.amount).toBe(1n)
  })

  it('uses getCurrencySelection and Acala-like who on Karura', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5KaruraAddr'
    const asset = { assetId: '123', amount: 5n } as WithAmount<TAssetInfo>
    const mockCustomCurrencyId = vi.fn().mockReturnValue('KAR_ID')
    vi.mocked(getChain).mockReturnValue({
      getCustomCurrencyId: mockCustomCurrencyId
    } as unknown as BifrostPolkadot<unknown, unknown>)

    const res = await pallet.mint(address, asset, 10n, 'Karura')

    expect(assertHasId).not.toHaveBeenCalled()
    expect(getChain).toHaveBeenCalledWith('Karura')
    expect(mockCustomCurrencyId).toHaveBeenCalledWith(asset)
    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.currency_id).toBe('KAR_ID')
    expect(res.balanceTx.params.amount).toBe(15n)
  })

  it('uses getCurrencySelection and Acala-like who on Acala', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5AcalaAddr'
    const asset = { assetId: '456', amount: 20n } as WithAmount<TAssetInfo>
    const mockGetCustomCurrencyId = vi.fn().mockReturnValue('ACA_ID')
    vi.mocked(getChain).mockReturnValue({
      getCustomCurrencyId: mockGetCustomCurrencyId
    } as unknown as BifrostPolkadot<unknown, unknown>)

    const res = await pallet.mint(address, asset, 2n, 'Acala')

    expect(assertHasId).not.toHaveBeenCalled()
    expect(getChain).toHaveBeenCalledWith('Acala')
    expect(mockGetCustomCurrencyId).toHaveBeenCalledWith(asset)
    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.currency_id).toBe('ACA_ID')
    expect(res.balanceTx.params.amount).toBe(22n)
  })
})
