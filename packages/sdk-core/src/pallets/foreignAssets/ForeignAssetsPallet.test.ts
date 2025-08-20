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
    const pallet = new ForeignAssetsPallet()
    const address = 'Alice'
    const location = { parents: 1, interior: { Here: null } }
    const asset = { location, amount: 123n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasLocation).mockImplementation(() => {})

    const res = await pallet.setBalance(address, asset)

    expect(vi.mocked(assertHasLocation)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(assertHasLocation)).toHaveBeenCalledWith(asset)

    expect(res.assetStatusTx?.module).toBe('ForeignAssets')
    expect(res.assetStatusTx?.method).toBe('force_asset_status')
    expect(res.assetStatusTx?.parameters.id).toBe(location)
    expect(res.assetStatusTx?.parameters.owner).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.issuer).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.admin).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.freezer).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.min_balance).toBe(0n)
    expect(res.assetStatusTx?.parameters.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.parameters.is_frozen).toBe(false)

    expect(res.balanceTx.module).toBe('ForeignAssets')
    expect(res.balanceTx.method).toBe('mint')
    expect(res.balanceTx.parameters.id).toBe(location)
    expect(res.balanceTx.parameters.beneficiary).toEqual({ Id: address })
    expect(res.balanceTx.parameters.amount).toBe(123n)
  })
})
