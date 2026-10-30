import type { TAssetInfo } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { UnsupportedOperationError } from '../errors'
import { BaseAssetsPallet } from './TAssets'

class TestPallet extends BaseAssetsPallet {
  mint = vi.fn()
  getBalance = vi.fn()
}

describe('BaseAssetsPallet.getAssetState', () => {
  it('throws when the pallet does not implement it', () => {
    const pallet = new TestPallet('Tokens')
    const api = {} as PolkadotApi<unknown, unknown, unknown>

    expect(() => pallet.getAssetState(api, {} as TAssetInfo)).toThrow(UnsupportedOperationError)
  })
})
