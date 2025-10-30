import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertHasId } from '../../utils'
import { AssetsPallet } from './AssetsPallet'

vi.mock('@paraspell/assets')
vi.mock('../../utils')

describe('AssetsPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses BigInt id and raw address for Moonbeam/Astar/Shiden and returns correct txs', async () => {
    const pallet = new AssetsPallet('Assets')
    const address = '0xAlice'
    const chain = 'Moonbeam' as TSubstrateChain
    const asset = { assetId: '123', amount: 999n } as WithAmount<TAssetInfo>

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(res.assetStatusTx?.module).toBe('Assets')
    expect(res.assetStatusTx?.method).toBe('force_asset_status')
    expect(typeof res.assetStatusTx?.parameters.id).toBe('bigint')
    expect(res.assetStatusTx?.parameters.id).toBe(123n)
    expect(res.assetStatusTx?.parameters.owner).toBe(address)
    expect(res.assetStatusTx?.parameters.issuer).toBe(address)
    expect(res.assetStatusTx?.parameters.admin).toBe(address)
    expect(res.assetStatusTx?.parameters.freezer).toBe(address)
    expect(res.assetStatusTx?.parameters.min_balance).toBe(0n)
    expect(res.assetStatusTx?.parameters.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.parameters.is_frozen).toBe(false)
    expect(res.balanceTx.module).toBe('Assets')
    expect(res.balanceTx.method).toBe('mint')
    expect(typeof res.balanceTx.parameters.id).toBe('bigint')
    expect(res.balanceTx.parameters.id).toBe(123n)
    expect(res.balanceTx.parameters.beneficiary).toBe(address)
    expect(res.balanceTx.parameters.amount).toBe(999n)
  })

  it('uses Number id and { Id: address } on non-EVM chains and returns correct txs', async () => {
    const pallet = new AssetsPallet('Assets')
    const address = '5FbrsAddr'
    const chain = 'Acala' as TSubstrateChain
    const asset = { assetId: '45', amount: 500n } as WithAmount<TAssetInfo>

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(typeof res.assetStatusTx?.parameters.id).toBe('number')
    expect(res.assetStatusTx?.parameters.id).toBe(45)
    expect(res.assetStatusTx?.parameters.owner).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.issuer).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.admin).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.freezer).toEqual({ Id: address })
    expect(res.assetStatusTx?.parameters.min_balance).toBe(0n)
    expect(res.assetStatusTx?.parameters.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.parameters.is_frozen).toBe(false)
    expect(typeof res.balanceTx.parameters.id).toBe('number')
    expect(res.balanceTx.parameters.id).toBe(45)
    expect(res.balanceTx.parameters.beneficiary).toEqual({ Id: address })
    expect(res.balanceTx.parameters.amount).toBe(500n)
  })
})
