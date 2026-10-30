import type { TAssetInfo } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { FungiblesPallet } from './FungiblesPallet'

describe('FungiblesPallet.getBalance', () => {
  it('queries the Account storage by location', async () => {
    const pallet = new FungiblesPallet('Fungibles')
    const location = { parents: 1, interior: { X1: [{ Parachain: 2000 }] } }
    const queryState = vi.fn().mockResolvedValue({ balance: 5n })
    const api = { queryState } as unknown as PolkadotApi<unknown, unknown, unknown>

    await expect(pallet.getBalance(api, 'Alice', { location } as TAssetInfo)).resolves.toBe(5n)

    expect(queryState).toHaveBeenCalledWith({
      module: 'Fungibles',
      method: 'Account',
      params: [location, 'Alice']
    })
  })
})
