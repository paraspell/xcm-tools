import type { TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { getAssetBalanceInternal } from '../../../pallets/assets/balance'
import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions } from '../../../types'
import { assertAddressIsString } from '../../../utils/assertions'
import { getRelayChainOf } from '../../../utils/chain/getRelayChainOf'
import { selectReserveByBalance } from './selectReserveByBalance'

vi.mock('../../../pallets/assets/balance')
vi.mock('../../../pallets/xcmPallet/utils')
vi.mock('../../../utils/assertions')
vi.mock('../../../utils/chain/getRelayChainOf')

const mkApi = () => {
  const init = vi.fn().mockResolvedValue(undefined)
  const convertLocationToAccount = vi.fn().mockResolvedValue('ResolvedAddr')
  const clone = vi.fn(() => ({ init, convertLocationToAccount }))
  return { clone, init, convertLocationToAccount } as unknown as IPolkadotApi<unknown, unknown>
}

describe('selectReserveByBalance', () => {
  const chain = 'Acala'
  const baseAsset: TAssetInfo = { symbol: 'DOT', amount: 100n } as unknown as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(createDestination).mockReturnValue({ parents: 0, interior: { Here: null } })
    vi.mocked(assertAddressIsString).mockReturnValue(undefined as unknown as void)
  })

  it('returns AssetHub<relay> when balance is sufficient there', async () => {
    const api = mkApi()

    vi.mocked(getAssetBalanceInternal).mockImplementation(async ({ chain }) =>
      Promise.resolve(chain === 'AssetHubPolkadot' ? 150n : 0n)
    )

    const options = {
      api,
      assetInfo: baseAsset,
      destination: 'Acala',
      address: '5Fabc',
      version: 4,
      paraIdTo: 2000
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>

    const res = await selectReserveByBalance(chain, options)
    expect(res).toBe('AssetHubPolkadot')
  })

  it('returns Relay when balance is sufficient only on relay', async () => {
    const api = mkApi()

    vi.mocked(getAssetBalanceInternal).mockImplementation(async ({ chain }) =>
      Promise.resolve(chain === 'AssetHubPolkadot' ? 0n : 200n)
    )

    const options = {
      api,
      assetInfo: baseAsset,
      destination: 'Acala',
      address: '5Fabc',
      version: 4,
      paraIdTo: 2000
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>

    const res = await selectReserveByBalance(chain, options)
    expect(res).toBe('Polkadot')
  })

  it('returns undefined when no candidate has enough balance', async () => {
    const api = mkApi()

    vi.mocked(getAssetBalanceInternal).mockResolvedValue(50n)

    const options = {
      api,
      assetInfo: baseAsset,
      destination: 'Acala',
      address: '5Fabc',
      version: 4,
      paraIdTo: 2000
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>

    const res = await selectReserveByBalance(chain, options)
    expect(res).toBeUndefined()
  })
})
