import { type TAssetInfo, type WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type Chain from '../../chains/Chain'
import type { TMintConfig } from '../../types'
import { assertHasId } from '../../utils'
import { AssetsPallet } from './AssetsPallet'

vi.mock('../../utils')

const apiMock = {} as unknown as PolkadotApi<unknown, unknown, unknown>

const chainMock = (config: TMintConfig) =>
  ({ resolveMintConfig: vi.fn().mockReturnValue(config) }) as unknown as Chain<
    unknown,
    unknown,
    unknown
  >

describe('AssetsPallet.mint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses a Number id and { Id } beneficiary by default', async () => {
    const pallet = new AssetsPallet('Assets')
    const address = '5FbrsAddr'
    const asset = { assetId: '45', amount: 500n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(apiMock, address, asset, 0n, chainMock({ useIdPrefix: true }))

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(res.assetStatusTx?.module).toBe('Assets')
    expect(res.assetStatusTx?.method).toBe('force_asset_status')
    expect(typeof res.assetStatusTx?.params.id).toBe('number')
    expect(res.assetStatusTx?.params.id).toBe(45)
    expect(res.assetStatusTx?.params.owner).toEqual({ Id: address })
    expect(res.assetStatusTx?.params.min_balance).toBe(0n)
    expect(res.assetStatusTx?.params.is_sufficient).toBe(true)
    expect(res.assetStatusTx?.params.is_frozen).toBe(false)
    expect(res.balanceTx.module).toBe('Assets')
    expect(res.balanceTx.method).toBe('mint')
    expect(typeof res.balanceTx.params.id).toBe('number')
    expect(res.balanceTx.params.id).toBe(45)
    expect(res.balanceTx.params.beneficiary).toEqual({ Id: address })
    expect(res.balanceTx.params.amount).toBe(500n)
  })

  it('uses a BigInt id and raw beneficiary', async () => {
    const pallet = new AssetsPallet('Assets')
    const address = '0xAlice'
    const asset = { assetId: '123', amount: 999n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const res = await pallet.mint(
      apiMock,
      address,
      asset,
      0n,
      chainMock({ useIdPrefix: false, useBigIntId: true })
    )

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(typeof res.assetStatusTx?.params.id).toBe('bigint')
    expect(res.assetStatusTx?.params.id).toBe(123n)
    expect(res.assetStatusTx?.params.owner).toBe(address)
    expect(res.balanceTx.params.id).toBe(123n)
    expect(res.balanceTx.params.beneficiary).toBe(address)
    expect(res.balanceTx.params.amount).toBe(999n)
  })

  it('uses the asset location as id and skips assertHasId', async () => {
    const pallet = new AssetsPallet('Assets')
    const address = '5FbrsAddr'
    const location = { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
    const asset = { location, amount: 500n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(
      apiMock,
      address,
      asset,
      0n,
      chainMock({ useLocationId: true, useIdPrefix: true })
    )

    expect(assertHasId).not.toHaveBeenCalled()
    expect(res.assetStatusTx?.params.id).toEqual(location)
    expect(res.assetStatusTx?.params.owner).toEqual({ Id: address })
    expect(res.balanceTx.params.id).toEqual(location)
    expect(res.balanceTx.params.beneficiary).toEqual({ Id: address })
    expect(res.balanceTx.params.amount).toBe(500n)
  })
})

describe('AssetsPallet.getBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const expectBigIntRetry = async (message: string) => {
    const pallet = new AssetsPallet('Assets')
    const address = '5FbrsAddr'
    const asset = { assetId: '77' } as TAssetInfo

    vi.mocked(assertHasId).mockImplementation(() => {})

    const queryState = vi
      .fn()
      .mockRejectedValueOnce(new Error(message))
      .mockResolvedValueOnce({ balance: 123n })

    const api = { queryState } as unknown as PolkadotApi<unknown, unknown, unknown>

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
  }

  it('retries with BigInt asset id when runtime entry is incompatible', async () => {
    await expectBigIntRetry('Incompatible runtime entry')
  })

  it('retries with BigInt asset id on API compatibility errors', async () => {
    await expectBigIntRetry('API Compatibility Error')
  })

  it('retries with BigInt asset id when the runtime expects an integer', async () => {
    await expectBigIntRetry('Number needs to be an integer')
  })
})
