import type { TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DuplicateAssetError } from '../../errors'
import type { TAssetInfo } from '../../types'
import { getNativeAssetsImpl, getOtherAssetsImpl } from '../assets'
import { Foreign } from '../assetSelectors'
import { findAssetInfo } from './findAssetInfo'

vi.mock('../assets')

const MOCK_ETH_LOCATION_1: TLocation = {
  parents: 2,
  interior: {
    X2: [
      {
        GlobalConsensus: {
          Ethereum: {
            chainId: 1
          }
        }
      },
      {
        AccountKey20: {
          network: undefined,
          key: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7'
        }
      }
    ]
  }
}

const MOCK_ETH_LOCATION_2: TLocation = {
  parents: 2,
  interior: {
    X2: [
      {
        GlobalConsensus: {
          Ethereum: {
            chainId: 1
          }
        }
      },
      {
        AccountKey20: {
          network: undefined,
          key: '0x1f752250f518e419f2f03804e25728c5c6dff73f'
        }
      }
    ]
  }
}

describe('findAssetInfo - Ethereum destination duplicate asset guard (#2461)', () => {
  beforeEach(() => {
    vi.mocked(getNativeAssetsImpl).mockReturnValue([])
    vi.mocked(getOtherAssetsImpl).mockReturnValue([])
  })

  it('throws DuplicateAssetError when multiple Ethereum assets match plain symbol', () => {
    const xrtA: TAssetInfo = {
      symbol: 'XRT',
      decimals: 18,
      existentialDeposit: '0',
      assetId: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7',
      location: MOCK_ETH_LOCATION_1
    }
    const xrtB: TAssetInfo = {
      symbol: 'XRT',
      decimals: 18,
      existentialDeposit: '0',
      assetId: '0x1f752250f518e419f2f03804e25728c5c6dff73f',
      location: MOCK_ETH_LOCATION_2
    }
    vi.mocked(getOtherAssetsImpl).mockReturnValue([xrtA, xrtB])

    expect(() => findAssetInfo('AssetHubPolkadot', { symbol: 'XRT' }, 'Ethereum')).toThrow(
      DuplicateAssetError
    )
  })

  it('throws DuplicateAssetError when multiple Ethereum assets match Foreign() specifier', () => {
    const xrtA: TAssetInfo = {
      symbol: 'XRT',
      decimals: 18,
      existentialDeposit: '0',
      assetId: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7',
      location: MOCK_ETH_LOCATION_1
    }
    const xrtB: TAssetInfo = {
      symbol: 'XRT',
      decimals: 18,
      existentialDeposit: '0',
      assetId: '0x1f752250f518e419f2f03804e25728c5c6dff73f',
      location: MOCK_ETH_LOCATION_2
    }
    vi.mocked(getOtherAssetsImpl).mockReturnValue([xrtA, xrtB])

    expect(() => findAssetInfo('AssetHubPolkadot', { symbol: Foreign('XRT') }, 'Ethereum')).toThrow(
      DuplicateAssetError
    )
  })

  it('returns single Ethereum asset when only one match exists', () => {
    const xrtA: TAssetInfo = {
      symbol: 'XRT',
      decimals: 18,
      existentialDeposit: '0',
      assetId: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7',
      location: MOCK_ETH_LOCATION_1
    }
    vi.mocked(getOtherAssetsImpl).mockReturnValue([xrtA])

    const result = findAssetInfo('AssetHubPolkadot', { symbol: 'XRT' }, 'Ethereum')
    expect(result).toBe(xrtA)
  })
})
