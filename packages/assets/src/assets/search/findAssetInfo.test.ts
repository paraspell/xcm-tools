// Contains tests for different Asset queries used in XCM call creation

import type { TLocation } from '@paraspell/sdk-common'
import { NODE_NAMES } from '@paraspell/sdk-common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isForeignAsset } from '../../guards'
import type { TAssetInfo, TForeignAssetInfo } from '../../types'
import * as assetFunctions from '../assets'
import { Foreign, ForeignAbstract, Native } from '../assetSelectors'
import { findAssetInfo } from './findAssetInfo'

const getAssetsObject = assetFunctions.getAssetsObject

describe('findAssetInfo', () => {
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
            const asset = findAssetInfo(node, { symbol: Foreign(other.symbol) }, null)
            expect(asset).toHaveProperty('symbol')
            expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
            expect(asset).toSatisfy(obj => 'assetId' in obj || 'location' in obj)
          }

          const otherAssetsMatchesById = otherAssets.filter(
            ({ assetId }) => assetId === other.assetId
          )
          if (otherAssetsMatchesById.length > 1 && other.assetId) {
            expect(() => findAssetInfo(node, { id: other.assetId as string }, null)).toThrow()
          }
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        const asset = findAssetInfo(node, { symbol: Native(other.symbol) }, null)
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
          const asset = findAssetInfo(node, { id: other.assetId ?? '' }, null)

          expect(asset).not.toBeNull()
          expect(isForeignAsset(asset as TAssetInfo)).toBe(true)
          expect(asset).toHaveProperty('assetId')
          expect(other.assetId).toEqual((asset as TForeignAssetInfo).assetId)
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(nativeAsset => {
        if (nativeAsset.symbol) {
          const asset = findAssetInfo(node, { symbol: Native(nativeAsset.symbol) }, null)
          expect(asset).toHaveProperty('symbol')
        }
      })
    })
  })

  it('should find assetId for KSM asset in AssetHubKusama', () => {
    const asset = findAssetInfo('AssetHubKusama', { symbol: Foreign('KSM') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = findAssetInfo('Moonbeam', { symbol: 'xcZTG' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    const asset = findAssetInfo('Moonbeam', { symbol: Foreign('xcZTG') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = findAssetInfo('Moonbeam', { symbol: 'xcWETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    const asset = findAssetInfo('Moonbeam', { symbol: Foreign('xcWETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: Foreign('WETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = findAssetInfo('Ethereum', { symbol: 'WETH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH.e') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH.e' }, 'Ethereum')
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
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH' }, 'Ethereum')
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
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: Foreign('MON.e') }, null)
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
    findAssetInfo('AssetHubPolkadot', { symbol: Foreign('MON.e') }, null)
  })

  it('Should find asset ending with .e on Ethereum when entered withou suffix', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH.e'
      }
    ])
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: Foreign('WETH') }, 'Ethereum')
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
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH') }, null)
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
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH.e') }, 'Ethereum')
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
    const asset = findAssetInfo('Ethereum', { symbol: Foreign('WETH') }, 'Ethereum')
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
            ss58Prefix: 42,
            supportsDryRunApi: false,
            supportsXcmPaymentApi: true,
            otherAssets: [],
            nativeAssets: []
          }
        : {
            nativeAssetSymbol: 'DOT',
            relayChainAssetSymbol: 'DOT',
            isEVM: false,
            ss58Prefix: 42,
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
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WTH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot ', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockImplementation(node => {
      return node === 'Ethereum'
        ? {
            nativeAssetSymbol: 'ETH',
            isEVM: false,
            ss58Prefix: 42,
            supportsDryRunApi: false,
            supportsXcmPaymentApi: true,
            relayChainAssetSymbol: 'DOT',
            otherAssets: [],
            nativeAssets: []
          }
        : {
            nativeAssetSymbol: 'DOT',
            isEVM: false,
            ss58Prefix: 42,
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
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WTH.e' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should not find asset with xc prefix on Astar becuase of duplicates', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    expect(() => findAssetInfo('Astar', { symbol: 'xcDOT' }, null)).toThrow()
  })

  it('Should throw error when duplicate dot asset on Hydration', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockResolvedValueOnce({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    expect(() => findAssetInfo('Hydration', { symbol: 'HDX' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after stripping "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    expect(() => findAssetInfo('Hydration', { symbol: 'xcDOT' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    expect(() => findAssetInfo('Hydration', { symbol: 'GLMR' }, null)).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    expect(() => findAssetInfo('Hydration', { symbol: Foreign('DOT') }, null)).toThrow()
  })

  it('should find asset with xc prefix on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    const asset = findAssetInfo('Acala', { symbol: Foreign('DOT') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find ethereum assets', () => {
    const asset = findAssetInfo('AssetHubPolkadot', { symbol: 'WETH' }, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find native asset on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    const asset = findAssetInfo('Acala', { symbol: Native('DOT') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('decimals')
  })

  it('should find foreign abstract asset on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    const asset = findAssetInfo('Acala', { symbol: ForeignAbstract('DOT1') }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should throw error when multiple matches in native and foreign assets', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    expect(() => findAssetInfo('Acala', { symbol: Foreign('DOT') }, null)).toThrow()
  })

  it('should find asset with lowercase matching', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
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
    const asset = findAssetInfo('Acala', { symbol: 'Glmr' }, null)
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should not find asset DOT native asset when specifier not present and is not in assets', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [],
      nativeAssets: []
    })
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
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
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
          } as TLocation
        }
      ],
      nativeAssets: []
    })
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
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
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
          } as TLocation
        }
      ],
      nativeAssets: []
    })
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
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
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
          } as TLocation
        }
      ],
      nativeAssets: []
    })
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
