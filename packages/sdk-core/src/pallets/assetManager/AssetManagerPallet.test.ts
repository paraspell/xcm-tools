import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertHasId } from '../../utils'
import { AssetManagerPallet } from './AssetManagerPallet'

vi.mock('../../utils')

describe('AssetManagerPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds updateBalance tx with ForeignAsset currency and calls assertHasId', async () => {
    const pallet = new AssetManagerPallet('AssetManager')
    const address = 'Alice'
    const asset = { assetId: '42', amount: 123n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n)

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(assertHasId).toHaveBeenCalledWith(asset)
    expect(res.balanceTx.module).toBe('AssetManager')
    expect(res.balanceTx.method).toBe('update_balance')
    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.currency_id).toEqual({ ForeignAsset: '42' })
    expect(res.balanceTx.params.amount).toBe(123n)
  })
})
