import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getEthErc20Balance } from '../../balance/getEthErc20Balance'
import { getChain } from '../../utils'

vi.mock('../../balance/getEthErc20Balance')

describe('EthereumTestnet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const ethereumTestnet = () =>
    getChain<unknown, unknown, unknown, 'EthereumTestnet'>('EthereumTestnet')

  it('should initialize with correct values', () => {
    const chain = ethereumTestnet()
    expect(chain.chain).toBe('EthereumTestnet')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })

  it('reads the ERC20 balance via getEthErc20Balance', async () => {
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    const asset = { assetId: 'erc20' } as TAssetInfo
    vi.mocked(getEthErc20Balance).mockResolvedValueOnce(456n)

    const result = await ethereumTestnet().getBalance(api, '0x456', asset)

    expect(getEthErc20Balance).toHaveBeenCalledWith('EthereumTestnet', asset, '0x456')
    expect(result).toBe(456n)
  })
})
