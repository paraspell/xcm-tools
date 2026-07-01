import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import type { TMintConfig } from '../../types'
import { ForeignAssetsPallet } from './ForeignAssetsPallet'

const apiMock = {} as unknown as PolkadotApi<unknown, unknown, unknown>

const chainMock = (config: TMintConfig) =>
  ({ resolveMintConfig: vi.fn().mockReturnValue(config) }) as unknown as SubstrateChain<
    unknown,
    unknown,
    unknown
  >

describe('ForeignAssetsPallet.mint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns force_asset_status and mint with { Id } owner/beneficiary when useIdPrefix is set', async () => {
    const pallet = new ForeignAssetsPallet('ForeignAssets')
    const address = 'Alice'
    const location = { parents: 1, interior: { Here: null } }
    const asset = { location, amount: 123n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(apiMock, address, asset, 0n, chainMock({ useIdPrefix: true }))

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

  it('uses a raw owner/beneficiary when useIdPrefix is false', async () => {
    const pallet = new ForeignAssetsPallet('ForeignAssets')
    const address = 'Alice'
    const location = { parents: 1, interior: { Here: null } }
    const asset = { location, amount: 1n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(apiMock, address, asset, 0n, chainMock({ useIdPrefix: false }))

    expect(res.assetStatusTx?.params.owner).toBe(address)
    expect(res.balanceTx.params.beneficiary).toBe(address)
  })
})
