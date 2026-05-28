import { type TAssetInfo, type WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { BalancesPallet } from './BalancesPallet'

const createApiMock = (isEvm: boolean) =>
  ({
    isChainEvm: vi.fn().mockReturnValue(isEvm)
  }) as unknown as PolkadotApi<unknown, unknown, unknown>

describe('BalancesPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses address string for Hydration chains', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = 'Alice'
    const chain = 'HydrationPaseo'
    const asset = { amount: 111n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(createApiMock(false), address, asset, 0n, chain)

    expect(res.balanceTx.module).toBe('Balances')
    expect(res.balanceTx.method).toBe('force_set_balance')
    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(111n)
  })

  it('uses address string for Basilisk', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = 'Alice'
    const chain = 'Basilisk'
    const asset = { amount: 222n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(createApiMock(false), address, asset, 0n, chain)

    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(222n)
  })

  it('uses address string when chain is EVM', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = '0xAlice'
    const chain = 'Moonbeam'
    const asset = { amount: 333n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(createApiMock(true), address, asset, 0n, chain)

    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(333n)
  })

  it('uses { Id: address } for other non-EVM chains', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = '5FbrsAddr'
    const chain = 'Acala'
    const asset = { amount: 444n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(createApiMock(false), address, asset, 0n, chain)

    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.new_free).toBe(444n)
  })
})
