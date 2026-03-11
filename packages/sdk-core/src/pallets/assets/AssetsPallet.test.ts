import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
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
    expect(typeof res.assetStatusTx?.params.id).toBe('bigint')
    expect(res.assetStatusTx?.params.id).toBe(123n)
    expect(res.assetStatusTx?.params.owner).toBe(address)
    expect(res.assetStatusTx?.params.issuer).toBe(address)
    expect(res.assetStatusTx?.params.admin).toBe(address)
    expect(res.assetStatusTx?.params.freezer).toBe(address)
    expect(res.assetStatusTx?.params.min_balance).toBe(0n)
    expect(res.assetStatusTx?.params.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.params.is_frozen).toBe(false)
    expect(res.balanceTx.module).toBe('Assets')
    expect(res.balanceTx.method).toBe('mint')
    expect(typeof res.balanceTx.params.id).toBe('bigint')
    expect(res.balanceTx.params.id).toBe(123n)
    expect(res.balanceTx.params.beneficiary).toBe(address)
    expect(res.balanceTx.params.amount).toBe(999n)
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
    expect(typeof res.assetStatusTx?.params.id).toBe('number')
    expect(res.assetStatusTx?.params.id).toBe(45)
    expect(res.assetStatusTx?.params.owner).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.issuer).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.admin).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.freezer).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.min_balance).toBe(0n)
    expect(res.assetStatusTx?.params.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.params.is_frozen).toBe(false)
    expect(typeof res.balanceTx.params.id).toBe('number')
    expect(res.balanceTx.params.id).toBe(45)
    expect(res.balanceTx.params.beneficiary).toEqual({ Id: address })
    expect(res.balanceTx.params.amount).toBe(500n)
  })
})

describe('AssetsPallet.getBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retries with BigInt asset id when runtime entry is incompatible', async () => {
    const pallet = new AssetsPallet('Assets')
    const address = '5FbrsAddr'
    const asset = { assetId: '77' } as TAssetInfo

    vi.mocked(assertHasId).mockImplementation(() => {})

    const queryState = vi
      .fn()
      .mockRejectedValueOnce(new Error('Incompatible runtime entry'))
      .mockResolvedValueOnce({ balance: 123n })

    const api = { queryState } as unknown as IPolkadotApi<unknown, unknown, unknown>

    const balance = await pallet.getBalance(api, address, asset)

    expect(queryState).toHaveBeenNthCalledWith(1, {
      module: 'Assets',
      method: 'Account',
      params: [77, address]
    })
    expect(queryState).toHaveBeenNthCalledWith(2, {
      module: 'Assets',
      method: 'Account',
      params: [77n, address]
    })
    expect(balance).toBe(123n)
  })
})
