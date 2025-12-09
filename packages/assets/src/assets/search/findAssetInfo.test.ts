// Contains tests for different Asset queries used in XCM call creation

import type { TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNativeAssets, getOtherAssets } from '../assets'
import { Foreign, ForeignAbstract, Native } from '../assetSelectors'
import { findAssetInfo } from './findAssetInfo'

vi.mock('../assets')

const MOCK_ETH_LOCATION: TLocation = {
  parents: 2,
  interior: {
    X1: [
      {
        GlobalConsensus: {
          Ethereum: {
            chainId: 1
          }
        }
      }
    ]
  }
}

describe('findAssetInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssets).mockReturnValue([])
    vi.mocked(getOtherAssets).mockReturnValue([])
  })

  it('should find assetId for KSM asset in AssetHubKusama', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 12,
        symbol: 'KSM'
      }
    ])
    const asset = findAssetInfo('AssetHubKusama', { symbol: Foreign('KSM') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'ZTG'
      }
    ])
    const asset = findAssetInfo('Moonbeam', { symbol: 'xcZTG' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'xcZTG'
      }
    ])
    const asset = findAssetInfo('Moonbeam', { symbol: Foreign('xcZTG') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH.e',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('Moonbeam', { symbol: 'xcWETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH.e',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('Moonbeam', { symbol: Foreign('xcWETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: Foreign('WETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH.e' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum when entered without suffix', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH.e',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset without .e to match e', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'MON'
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: Foreign('MON.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset without .e to match e', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'MON'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'MON',
        location: MOCK_ETH_LOCATION
      }
    ])
    findAssetInfo('AssetHubPolkadot', { symbol: Foreign('MON.e') }, null)
  })

  it('Should find asset ending with .e on Ethereum when entered without suffix', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH.e',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: Foreign('WETH') }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find weth with suffix on Ethereum', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH'
      }
    ])
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find weth with suffix on Ethereum', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH.e') }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find weth with suffix on Ethereum', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH.e',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH') }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot with duplicates', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WTH'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'WTH'
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WTH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot ', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WTH.e'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'WTH.e'
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WTH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should not find asset with xc prefix on Astar becuase of duplicates', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'DOT'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'DOT'
      }
    ])
    vi.mocked(getNativeAssets).mockReturnValue([
      {
        symbol: 'DOT',
        decimals: 10,
        isNative: true
      }
    ])
    expect(() => findAssetInfo('Astar', { symbol: 'xcDOT' }, null)).toThrow()
  })

  it('Should throw error when duplicate dot asset on Hydration', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'DOT'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'DOT'
      }
    ])
    expect(() => findAssetInfo('Hydration', { symbol: 'DOT' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after stripping "xc" prefix', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'DOT'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'DOT'
      }
    ])
    expect(() => findAssetInfo('Hydration', { symbol: 'xcDOT' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'xcGLMR'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'xcGLMR'
      }
    ])
    expect(() => findAssetInfo('Hydration', { symbol: 'GLMR' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'xcDOT'
      },
      {
        assetId: '2',
        decimals: 18,
        symbol: 'xcDOT'
      }
    ])
    expect(() => findAssetInfo('Hydration', { symbol: Foreign('DOT') }, null)).toThrow()
  })

  it('should find asset with xc prefix on Acala', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '2',
        decimals: 18,
        symbol: 'xcDOT'
      }
    ])
    const asset = findAssetInfo('Acala', { symbol: Foreign('DOT') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find ethereum assets', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        decimals: 18,
        symbol: 'WETH',
        location: MOCK_ETH_LOCATION
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find native asset on Acala', () => {
    vi.mocked(getNativeAssets).mockReturnValue([
      {
        symbol: 'DOT',
        decimals: 10,
        isNative: true
      }
    ])
    const asset = findAssetInfo('Acala', { symbol: Native('DOT') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('decimals')
  })

  it('should find foreign abstract asset on Acala', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        symbol: 'DOT',
        decimals: 10,
        alias: 'DOT1'
      },
      {
        assetId: '2',
        symbol: 'DOT',
        decimals: 10,
        alias: 'DOT2'
      }
    ])
    const asset = findAssetInfo('Acala', { symbol: ForeignAbstract('DOT1') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should throw error when multiple matches in native and foreign assets', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '1',
        symbol: 'DOT',
        alias: 'DOT1',
        decimals: 10
      },
      {
        assetId: '2',
        symbol: 'DOT',
        alias: 'DOT2',
        decimals: 10
      }
    ])
    vi.mocked(getNativeAssets).mockReturnValue([
      {
        symbol: 'DOT',
        decimals: 10,
        isNative: true
      }
    ])
    expect(() => findAssetInfo('Acala', { symbol: Foreign('DOT') }, null)).toThrow()
  })

  it('should find asset with lowercase matching', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '2',
        decimals: 18,
        symbol: 'glmr',
        alias: 'glmr2'
      }
    ])
    const asset = findAssetInfo('Acala', { symbol: 'Glmr' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should not find asset DOT native asset when specifier not present and is not in assets', () => {
    vi.mocked(getOtherAssets).mockReturnValue([])
    vi.mocked(getNativeAssets).mockReturnValue([])
    const asset = findAssetInfo('Acala', { symbol: 'dot' }, null)
    expect(asset).toBeNull()
  })

  it('Should return null when passing a location currency that is not present', () => {
    const asset = findAssetInfo(
      'Astar',
      {
        location: {
          parents: 1,
          interior: {
            X1: {
              PalletInstance: 1
            }
          }
        }
      },
      null
    )
    expect(asset).toBeNull()
  })

  it('should return asset when passing a location currency that is present', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '2',
        symbol: 'dot',
        decimals: 12,
        location: {
          parents: 1,
          interior: {
            X3: [
              {
                Parachain: 1000
              },
              {
                PalletInstance: 50
              },
              {
                GeneralIndex: 1984
              }
            ]
          }
        }
      }
    ])
    const asset = findAssetInfo(
      'Astar',
      {
        location: {
          parents: 1,
          interior: {
            X3: [
              {
                Parachain: 1000
              },
              {
                PalletInstance: 50
              },
              {
                GeneralIndex: 1984
              }
            ]
          }
        }
      },
      null
    )
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should return asset when passing a location currency that is present', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '2',
        symbol: 'dot',
        decimals: 12,
        location: {
          parents: 1,
          interior: {
            X3: [
              {
                Parachain: 1000
              },
              {
                PalletInstance: 50
              },
              {
                GeneralIndex: 1984
              }
            ]
          }
        }
      }
    ])
    const asset = findAssetInfo(
      'Astar',
      {
        location: JSON.stringify({
          parents: 1,
          interior: {
            X3: [
              {
                Parachain: 1000
              },
              {
                PalletInstance: 50
              },
              {
                GeneralIndex: 1984
              }
            ]
          }
        })
      },
      null
    )
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should return asset when passing a location currency with commas that is present', () => {
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        assetId: '2',
        symbol: 'dot',
        decimals: 12,
        location: {
          parents: 1,
          interior: {
            X3: [
              {
                Parachain: '1000'
              },
              {
                PalletInstance: '50'
              },
              {
                GeneralIndex: '1,984'
              }
            ]
          }
        }
      }
    ])
    const asset = findAssetInfo(
      'Astar',
      {
        location: JSON.stringify({
          parents: 1,
          interior: {
            X3: [
              {
                Parachain: '1000'
              },
              {
                PalletInstance: '50'
              },
              {
                GeneralIndex: '1984'
              }
            ]
          }
        })
      },
      null
    )
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })
})
