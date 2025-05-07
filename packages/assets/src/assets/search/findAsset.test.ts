// Contains tests for different Asset queries used in XCM call creation

import type { TMultiLocation } from '@paraspell/sdk-common'
import { NODE_NAMES } from '@paraspell/sdk-common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isForeignAsset } from '../../guards'
import type { TAsset, TForeignAsset } from '../../types'
import * as assetFunctions from '../assets'
import { Foreign, ForeignAbstract, Native } from '../assetSelectors'
import { findAsset } from './findAsset'

const getAssetsObject = assetFunctions.getAssetsObject

describe('getAssetBySymbolOrId', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return assetId and symbol for every foreign asset', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)
      otherAssets.forEach(other => {
        if (other.symbol !== undefined) {
          const otherAssetsMatches = otherAssets.filter(
            ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === other.symbol?.toLowerCase()
          )
          if (otherAssetsMatches.length < 2) {
            const asset = findAsset(node, { symbol: Foreign(other.symbol) }, null)
            expect(asset).toHaveProperty('symbol')
            expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
            expect(asset).toSatisfy(obj => 'assetId' in obj || 'multiLocation' in obj)
          }

          const otherAssetsMatchesById = otherAssets.filter(
            ({ assetId }) => assetId === other.assetId
          )
          if (otherAssetsMatchesById.length > 1 && other.assetId) {
            expect(() => findAsset(node, { id: other.assetId as string }, null)).toThrow()
          }
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        const asset = findAsset(node, { symbol: Native(other.symbol) }, null)
        expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
        expect(asset).toHaveProperty('symbol')
      })
    })
  })

  it('should return assetId and symbol for every foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)

      otherAssets.forEach(other => {
        if (other.assetId === undefined) {
          return
        }
        const hasDuplicateIds =
          otherAssets.filter(asset => asset.assetId === other.assetId).length > 1
        if (!hasDuplicateIds) {
          const asset = findAsset(node, { id: other.assetId ?? '' }, null)

          expect(asset).not.toBeNull()
          expect(isForeignAsset(asset as TAsset)).toBe(true)
          expect(asset).toHaveProperty('assetId')
          expect(other.assetId).toEqual((asset as TForeignAsset).assetId)
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(nativeAsset => {
        if (nativeAsset.symbol) {
          const asset = findAsset(node, { symbol: Native(nativeAsset.symbol) }, null)
          expect(asset).toHaveProperty('symbol')
        }
      })
    })
  })

  it('should find assetId for KSM asset in AssetHubKusama', () => {
    const asset = findAsset('AssetHubKusama', { symbol: 'USDt' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = findAsset('Moonbeam', { symbol: 'xcZTG' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    const asset = findAsset('Moonbeam', { symbol: Foreign('xcZTG') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = findAsset('Moonbeam', { symbol: 'xcWETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    const asset = findAsset('Moonbeam', { symbol: Foreign('xcWETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    const asset = findAsset('AssetHubPolkadot', { symbol: 'WETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    const asset = findAsset('AssetHubPolkadot', { symbol: Foreign('WETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = findAsset('Ethereum', { symbol: 'WETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = findAsset('Ethereum', { symbol: Foreign('WETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = findAsset('AssetHubPolkadot', { symbol: 'WETH.e' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum when entered withou suffix', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH.e'
      }
    ])
    const asset = findAsset('AssetHubPolkadot', { symbol: 'WETH' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset without .e to match e', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'MON'
      }
    ])
    const asset = findAsset('AssetHubPolkadot', { symbol: Foreign('MON.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset without .e to match e', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockImplementation(node =>
      node === 'Ethereum'
        ? []
        : [
            {
              assetId: '1',
              symbol: 'MON'
            },
            {
              assetId: '2',
              symbol: 'MON'
            }
          ]
    )
    findAsset('AssetHubPolkadot', { symbol: Foreign('MON.e') }, null)
  })

  it('Should find asset ending with .e on Ethereum when entered withou suffix', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH.e'
      }
    ])
    const asset = findAsset('AssetHubPolkadot', { symbol: Foreign('WETH') }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find weth with suffix on Ethereum', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH.e'
      }
    ])
    const asset = findAsset('Ethereum', { symbol: Foreign('WETH') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find weth with suffix on Ethereum', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH'
      }
    ])
    const asset = findAsset('Ethereum', { symbol: Foreign('WETH.e') }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find weth with suffix on Ethereum', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH.e'
      }
    ])
    const asset = findAsset('Ethereum', { symbol: Foreign('WETH') }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot with duplicates', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockImplementation(node => {
      return node === 'Ethereum'
        ? {
            nativeAssetSymbol: 'ETH',
            relayChainAssetSymbol: 'DOT',
            isEVM: false,
            supportsDryRunApi: false,
            supportsXcmPaymentApi: true,
            otherAssets: [],
            nativeAssets: []
          }
        : {
            nativeAssetSymbol: 'DOT',
            relayChainAssetSymbol: 'DOT',
            isEVM: false,
            supportsDryRunApi: false,
            supportsXcmPaymentApi: true,
            otherAssets: [
              {
                assetId: '1',
                symbol: 'WTH'
              },
              {
                assetId: '2',
                symbol: 'WTH'
              }
            ],
            nativeAssets: []
          }
    })
    const asset = findAsset('AssetHubPolkadot', { symbol: 'WTH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot ', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockImplementation(node => {
      return node === 'Ethereum'
        ? {
            nativeAssetSymbol: 'ETH',
            isEVM: false,
            supportsDryRunApi: false,
            supportsXcmPaymentApi: true,
            relayChainAssetSymbol: 'DOT',
            otherAssets: [],
            nativeAssets: []
          }
        : {
            nativeAssetSymbol: 'DOT',
            isEVM: false,
            supportsDryRunApi: false,
            supportsXcmPaymentApi: true,
            relayChainAssetSymbol: 'DOT',
            otherAssets: [
              {
                assetId: '1',
                symbol: 'WTH.e'
              },
              {
                assetId: '2',
                symbol: 'WTH.e'
              }
            ],
            nativeAssets: []
          }
    })
    const asset = findAsset('AssetHubPolkadot', { symbol: 'WTH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should not find asset with xc prefix on Astar becuase of duplicates', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'DOT'
        },
        {
          assetId: '2',
          symbol: 'DOT'
        }
      ],
      nativeAssets: [
        {
          symbol: 'DOT',
          decimals: 10,
          isNative: true
        }
      ]
    })
    expect(() => findAsset('Astar', { symbol: 'xcDOT' }, null)).toThrow()
  })

  it('Should throw error when duplicate dot asset on Hydration', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockResolvedValueOnce({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'DOT'
        },
        {
          assetId: '2',
          symbol: 'DOT'
        }
      ],
      nativeAssets: []
    })
    expect(() => findAsset('Hydration', { symbol: 'HDX' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after stripping "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'DOT'
        },
        {
          assetId: '2',
          symbol: 'DOT'
        }
      ],
      nativeAssets: []
    })
    expect(() => findAsset('Hydration', { symbol: 'xcDOT' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'xcGLMR'
        },
        {
          assetId: '2',
          symbol: 'xcGLMR'
        }
      ],
      nativeAssets: []
    })
    expect(() => findAsset('Hydration', { symbol: 'GLMR' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'xcDOT'
        },
        {
          assetId: '2',
          symbol: 'xcDOT'
        }
      ],
      nativeAssets: []
    })
    expect(() => findAsset('Hydration', { symbol: Foreign('DOT') }, null)).toThrow()
  })

  it('should find asset with xc prefix on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'xcDOT'
        }
      ],
      nativeAssets: []
    })
    const asset = findAsset('Acala', { symbol: Foreign('DOT') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find ethereum assets', () => {
    const asset = findAsset('AssetHubPolkadot', { symbol: 'WETH' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find native asset on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [],
      nativeAssets: [
        {
          symbol: 'DOT',
          decimals: 10,
          isNative: true
        }
      ]
    })
    const asset = findAsset('Acala', { symbol: Native('DOT') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('decimals')
  })

  it('should find foreign abstract asset on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'DOT',
          alias: 'DOT1'
        },
        {
          assetId: '2',
          symbol: 'DOT',
          alias: 'DOT2'
        }
      ],
      nativeAssets: []
    })
    const asset = findAsset('Acala', { symbol: ForeignAbstract('DOT1') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should throw error when multiple matches in native and foreign assets', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '1',
          symbol: 'DOT',
          alias: 'DOT1'
        },
        {
          assetId: '2',
          symbol: 'DOT',
          alias: 'DOT2'
        }
      ],
      nativeAssets: [
        {
          symbol: 'DOT',
          decimals: 10,
          isNative: true
        }
      ]
    })
    expect(() => findAsset('Acala', { symbol: Foreign('DOT') }, null)).toThrow()
  })

  it('should find asset with lowercase matching', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'glmr',
          alias: 'glmr2'
        }
      ],
      nativeAssets: []
    })
    const asset = findAsset('Acala', { symbol: 'Glmr' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should not find asset DOT native asset when specifier not present and is not in assets', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [],
      nativeAssets: []
    })
    const asset = findAsset('Acala', { symbol: 'dot' }, null)
    expect(asset).toBeNull()
  })

  it('Should return null when passing a multilocation currency that is not present', () => {
    const asset = findAsset(
      'Astar',
      {
        multilocation: {
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

  it('should return asset when passing a multilocation currency that is present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
          multiLocation: {
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
          } as TMultiLocation
        }
      ],
      nativeAssets: []
    })
    const asset = findAsset(
      'Astar',
      {
        multilocation: {
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

  it('should return asset when passing a multilocation currency that is present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
          multiLocation: {
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
          } as TMultiLocation
        }
      ],
      nativeAssets: []
    })
    const asset = findAsset(
      'Astar',
      {
        multilocation: JSON.stringify({
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

  it('should return asset when passing a multilocation currency with commas that is present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
          multiLocation: {
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
          } as TMultiLocation
        }
      ],
      nativeAssets: []
    })
    const asset = findAsset(
      'Astar',
      {
        multilocation: JSON.stringify({
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
