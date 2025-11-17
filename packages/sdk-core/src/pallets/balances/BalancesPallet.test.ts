import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BalancesPallet } from './BalancesPallet'

vi.mock('@paraspell/assets')

describe('BalancesPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses address string for Hydration chains', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = 'Alice'
    const chain = 'HydrationPaseo' as TSubstrateChain
    const asset = { amount: 111n } as WithAmount<TAssetInfo>

    vi.mocked(isChainEvm).mockReturnValue(false)

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(res.balanceTx.module).toBe('Balances')
    expect(res.balanceTx.method).toBe('force_set_balance')
    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(111n)
  })

  it('uses address string for Basilisk', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = 'Alice'
    const chain = 'Basilisk' as TSubstrateChain
    const asset = { amount: 222n } as WithAmount<TAssetInfo>

    vi.mocked(isChainEvm).mockReturnValue(false)

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(222n)
  })

  it('uses address string when chain is EVM', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = '0xAlice'
    const chain = 'Moonbeam' as TSubstrateChain
    const asset = { amount: 333n } as WithAmount<TAssetInfo>

    vi.mocked(isChainEvm).mockReturnValue(true)

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(333n)
  })

  it('uses { Id: address } for other non-EVM chains', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = '5FbrsAddr'
    const chain = 'Acala' as TSubstrateChain
    const asset = { amount: 444n } as WithAmount<TAssetInfo>

    vi.mocked(isChainEvm).mockReturnValue(false)

    const res = await pallet.mint(address, asset, 0n, chain)

    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.new_free).toBe(444n)
  })
})
