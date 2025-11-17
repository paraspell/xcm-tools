import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertHasLocation } from '../../utils'
import { ForeignAssetsPallet } from './ForeignAssetsPallet'

vi.mock('../../utils')

describe('ForeignAssetsPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns force_asset_status and mint with correct params', async () => {
    const pallet = new ForeignAssetsPallet('ForeignAssets')
    const address = 'Alice'
    const location = { parents: 1, interior: { Here: null } }
    const asset = { location, amount: 123n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasLocation).mockImplementation(() => {})

    const res = await pallet.mint(address, asset)

    expect(assertHasLocation).toHaveBeenCalledTimes(1)
    expect(assertHasLocation).toHaveBeenCalledWith(asset)

    expect(res.assetStatusTx?.module).toBe('ForeignAssets')
    expect(res.assetStatusTx?.method).toBe('force_asset_status')
    expect(res.assetStatusTx?.params.id).toBe(location)
    expect(res.assetStatusTx?.params.owner).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.issuer).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.admin).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.freezer).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.min_balance).toBe(0n)
    expect(res.assetStatusTx?.params.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.params.is_frozen).toBe(false)

    expect(res.balanceTx.module).toBe('ForeignAssets')
    expect(res.balanceTx.method).toBe('mint')
    expect(res.balanceTx.params.id).toBe(location)
    expect(res.balanceTx.params.beneficiary).toEqual({ Id: address })
    expect(res.balanceTx.params.amount).toBe(123n)
  })
})
