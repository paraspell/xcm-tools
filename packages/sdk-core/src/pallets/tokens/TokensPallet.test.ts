import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import { assertHasId } from '../../utils'
import { TokensPallet } from './TokensPallet'

vi.mock('../../utils')

const apiMock = {} as unknown as PolkadotApi<unknown, unknown, unknown>

describe('TokensPallet.mint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the raw assetId as currency id when useCustomCurrencyId is not set', async () => {
    const pallet = new TokensPallet('Tokens')
    const address = 'Alice'
    const asset = { assetId: '123', amount: 777n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const chain = { resolveMintConfig: () => ({}) } as unknown as SubstrateChain<
      unknown,
      unknown,
      unknown
    >

    const res = await pallet.mint(apiMock, address, asset, 0n, chain)

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(res.balanceTx.module).toBe('Tokens')
    expect(res.balanceTx.method).toBe('set_balance')
    expect(res.balanceTx.params).toEqual({
      who: { Id: address },
      currency_id: '123',
      new_free: 777n,
      new_reserved: 0n
    })
  })

  it('resolves the currency id via getCustomCurrencyId when useCustomCurrencyId is set', async () => {
    const pallet = new TokensPallet('Tokens')
    const address = 'Alice'
    const asset = { assetId: '5', isNative: false, amount: 5n } as WithAmount<TAssetInfo>

    const getCustomCurrencyId = vi.fn().mockReturnValue({ Token: 'BNC' })
    const chain = {
      resolveMintConfig: () => ({ useCustomCurrencyId: true }),
      getCustomCurrencyId
    } as unknown as SubstrateChain<unknown, unknown, unknown>

    const res = await pallet.mint(apiMock, address, asset, 10n, chain)

    expect(assertHasId).not.toHaveBeenCalled()
    expect(getCustomCurrencyId).toHaveBeenCalledWith(apiMock, asset)
    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.currency_id).toEqual({ Token: 'BNC' })
    expect(res.balanceTx.params.new_free).toBe(15n)
    expect(res.balanceTx.params.new_reserved).toBe(0n)
  })

  it('resolves ETH assets by location before computing the currency id', async () => {
    const pallet = new TokensPallet('Tokens')
    const address = 'Alice'
    const location = { parents: 1, interior: { Here: null } }
    const asset = {
      assetId: '0xabc',
      isNative: false,
      location,
      amount: 1n
    } as WithAmount<TAssetInfo>

    const resolved = { assetId: '9' } as TAssetInfo
    const getCustomCurrencyId = vi.fn().mockReturnValue({ Token2: 9 })
    const findAssetInfoOrThrow = vi.fn().mockReturnValue(resolved)
    const api = { findAssetInfoOrThrow } as unknown as PolkadotApi<unknown, unknown, unknown>
    const chain = {
      chain: 'BifrostKusama',
      resolveMintConfig: () => ({ useCustomCurrencyId: true }),
      getCustomCurrencyId
    } as unknown as SubstrateChain<unknown, unknown, unknown>

    const res = await pallet.mint(api, address, asset, 0n, chain)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('BifrostKusama', { location })
    expect(getCustomCurrencyId).toHaveBeenCalledWith(api, resolved)
    expect(res.balanceTx.params.currency_id).toEqual({ Token2: 9 })
  })
})
