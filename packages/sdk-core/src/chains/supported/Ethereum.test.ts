import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getEthErc20Balance } from '../../balance/getEthErc20Balance'
import { getChain } from '../../utils'

vi.mock('../../balance/getEthErc20Balance')

describe('Ethereum', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const ethereum = () => getChain<unknown, unknown, unknown, 'Ethereum'>('Ethereum')

  it('should initialize with correct values', () => {
    const chain = ethereum()
    expect(chain.chain).toBe('Ethereum')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('reads the ERC20 balance via getEthErc20Balance', async () => {
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    const asset = { assetId: 'erc20' } as TAssetInfo
    vi.mocked(getEthErc20Balance).mockResolvedValueOnce(123n)

    const result = await ethereum().getBalance(api, '0x123', asset)

    expect(getEthErc20Balance).toHaveBeenCalledWith('Ethereum', asset, '0x123')
    expect(result).toBe(123n)
  })
})
