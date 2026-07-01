import type { TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { BaseAssetsPallet } from '../../types'
import { getChain } from '../../utils'

vi.mock('../../pallets')
vi.mock('../../pallets/polkadotXcm')

describe('Relaychain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Polkadot is the concrete relaychain used to exercise the shared Relaychain behaviour
  const relaychain = () => getChain<unknown, unknown, unknown, 'Polkadot'>('Polkadot')

  it('reads balance from the System pallet', async () => {
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    const asset = { symbol: 'DOT' } as TAssetInfo
    const palletGetBalance = vi.fn().mockResolvedValueOnce(55n)
    vi.mocked(getPalletInstance).mockReturnValueOnce({
      getBalance: palletGetBalance
    } as unknown as BaseAssetsPallet)

    const result = await relaychain().getBalance(api, 'addr', asset)

    expect(getPalletInstance).toHaveBeenCalledWith('System')
    expect(palletGetBalance).toHaveBeenCalledWith(api, 'addr', asset)
    expect(result).toBe(55n)
  })

  it('delegates transfers to transferPolkadotXcm', async () => {
    const input = {
      assetInfo: { isNative: true, symbol: 'DOT', amount: 100n }
    } as Parameters<ReturnType<typeof relaychain>['transferPolkadotXCM']>[0]

    await relaychain().transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })
})
