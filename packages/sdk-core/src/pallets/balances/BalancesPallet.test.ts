import { type TAssetInfo, type WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import type { TMintConfig } from '../../types'
import { BalancesPallet } from './BalancesPallet'

const apiMock = {} as unknown as PolkadotApi<unknown, unknown, unknown>

const chainMock = (config: TMintConfig) =>
  ({ resolveMintConfig: vi.fn().mockReturnValue(config) }) as unknown as SubstrateChain<
    unknown,
    unknown,
    unknown
  >

describe('BalancesPallet.mint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps the address as { Id } when useIdPrefix is set and adds the amount to the balance', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = '5FbrsAddr'
    const asset = { amount: 111n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(apiMock, address, asset, 10n, chainMock({ useIdPrefix: true }))

    expect(res.balanceTx.module).toBe('Balances')
    expect(res.balanceTx.method).toBe('force_set_balance')
    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.new_free).toBe(121n)
  })

  it('uses the raw address when useIdPrefix is false', async () => {
    const pallet = new BalancesPallet('Balances')
    const address = '0xAlice'
    const asset = { amount: 444n } as WithAmount<TAssetInfo>

    const res = await pallet.mint(apiMock, address, asset, 0n, chainMock({ useIdPrefix: false }))

    expect(res.balanceTx.params.who).toBe(address)
    expect(res.balanceTx.params.new_free).toBe(444n)
  })
})
