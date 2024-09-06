import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import { getOtherAssets } from '../assets'

vi.mock('../assets', () => ({
  getOtherAssets: vi.fn()
}))

describe('getAssetHubMultiLocation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns correct multi-location for MYTH symbol', () => {
    const result = getAssetHubMultiLocation('MYTH')
    expect(result).toEqual({
      parents: 1,
      interior: {
        X1: {
          Parachain: '3369'
        }
      }
    })
  })

  it('returns correct multi-location for KSM symbol', () => {
    const result = getAssetHubMultiLocation('KSM')
    expect(result).toEqual({
      parents: 2,
      interior: {
        X1: {
          GlobalConsensus: 'Kusama'
        }
      }
    })
  })

  it('returns correct multi-location for Ethereum asset', () => {
    // Mock getOtherAssets to return a fake Ethereum asset
    const mockEthAssets = [{ symbol: 'ETH', assetId: '0x123' }]
    vi.mocked(getOtherAssets).mockReturnValue(mockEthAssets)

    const result = getAssetHubMultiLocation('ETH')

    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(result).toEqual({
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
              network: null,
              key: '0x123'
            }
          }
        ]
      }
    })
  })

  it('returns null if symbol is not found', () => {
    // Mock getOtherAssets to return an empty array
    vi.mocked(getOtherAssets).mockReturnValue([])

    const result = getAssetHubMultiLocation('NON_EXISTENT')

    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(result).toBeNull()
  })
})
