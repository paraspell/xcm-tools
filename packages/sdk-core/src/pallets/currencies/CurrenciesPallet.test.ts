import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import { assertHasId } from '../../utils'
import { CurrenciesPallet } from './CurrenciesPallet'

vi.mock('../../utils')

const apiMock = {} as unknown as PolkadotApi<unknown, unknown, unknown>

describe('CurrenciesPallet.mint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds update_balance with a numeric currency id and raw who by default', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5FbrsAddr'
    const asset = { assetId: '45', amount: 999n } as WithAmount<TAssetInfo>

    vi.mocked(assertHasId).mockImplementation(() => {})

    const chain = { resolveMintConfig: () => ({}) } as unknown as SubstrateChain<
      unknown,
      unknown,
      unknown
    >

    const res = await pallet.mint(apiMock, address, asset, 0n, chain)

    expect(assertHasId).toHaveBeenCalledTimes(1)
    expect(res.balanceTx.module).toBe('Currencies')
    expect(res.balanceTx.method).toBe('update_balance')
    expect(res.balanceTx.params.who).toBe(address)
    expect(typeof res.balanceTx.params.currency_id).toBe('number')
    expect(res.balanceTx.params.currency_id).toBe(45)
    expect(res.balanceTx.params.amount).toBe(999n)
  })

  it('uses getCustomCurrencyId and { Id } who when useCustomCurrencyId is set', async () => {
    const pallet = new CurrenciesPallet('Currencies')
    const address = '5AcalaAddr'
    const asset = { assetId: '456', amount: 20n } as WithAmount<TAssetInfo>

    const getCustomCurrencyId = vi.fn().mockReturnValue('ACA_ID')
    const chain = {
      resolveMintConfig: () => ({ useCustomCurrencyId: true }),
      getCustomCurrencyId
    } as unknown as SubstrateChain<unknown, unknown, unknown>

    const res = await pallet.mint(apiMock, address, asset, 2n, chain)

    expect(assertHasId).not.toHaveBeenCalled()
    expect(getCustomCurrencyId).toHaveBeenCalledWith(apiMock, asset)
    expect(res.balanceTx.params.who).toEqual({ Id: address })
    expect(res.balanceTx.params.currency_id).toBe('ACA_ID')
    expect(res.balanceTx.params.amount).toBe(22n)
  })
})
