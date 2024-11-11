// Contains tests for different Asset queries used in XCM call creation

import { afterEach, describe, expect, it, vi } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'
import * as assetFunctions from './assets'
import { getDefaultPallet } from '../pallets'
import { isRelayChain } from '../../utils'
import type { TAsset, TForeignAsset, TMultiLocation, TNodePolkadotKusama } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import { Foreign, ForeignAbstract, Native } from './assetSelectors'

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
            const asset = getAssetBySymbolOrId(node, { symbol: Foreign(other.symbol) })
            expect(asset).toHaveProperty('symbol')
            expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
            if (
              !isRelayChain(node) &&
              node !== 'Ethereum' &&
              getDefaultPallet(node as TNodePolkadotKusama) === 'XTokens'
            ) {
              expect(asset).toHaveProperty('assetId')
            }
          }

          const otherAssetsMatchesById = otherAssets.filter(
            ({ assetId }) => assetId === other.assetId
          )
          if (otherAssetsMatchesById.length > 1 && other.assetId) {
            expect(() => getAssetBySymbolOrId(node, { id: other.assetId as string })).toThrow()
          }
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        const asset = getAssetBySymbolOrId(node, { symbol: other.symbol }, true)
        expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
        expect(asset).toHaveProperty('symbol')
      })
    })
  })

  it('should return assetId and symbol for every foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)

      otherAssets.forEach(other => {
        const hasDuplicateIds =
          otherAssets.filter(asset => asset.assetId === other.assetId).length > 1
        if (!hasDuplicateIds) {
          const asset = getAssetBySymbolOrId(node, { id: other.assetId ?? '' })
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
          const asset = getAssetBySymbolOrId(node, { symbol: Native(nativeAsset.symbol) })
          expect(asset).toHaveProperty('symbol')
        }
      })
    })
  })

  it('should return symbol for every node relay chain asset symbol', () => {
    NODE_NAMES.forEach(node => {
      const { relayChainAssetSymbol } = getAssetsObject(node)
      const asset = getAssetBySymbolOrId(node, { symbol: relayChainAssetSymbol }, true)
      expect(asset).toHaveProperty('symbol')
    })
  })

  it('should find assetId for KSM asset in AssetHubKusama', () => {
    const asset = getAssetBySymbolOrId('AssetHubKusama', { symbol: 'USDt' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = getAssetBySymbolOrId('Moonbeam', { symbol: 'xcZTG' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    const asset = getAssetBySymbolOrId('Moonbeam', { symbol: Foreign('xcZTG') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = getAssetBySymbolOrId('Moonbeam', { symbol: 'xcWETH.e' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam using Foreign selector', () => {
    const asset = getAssetBySymbolOrId('Moonbeam', { symbol: Foreign('xcWETH.e') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WETH.e' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot', () => {
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: Foreign('WETH.e') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = getAssetBySymbolOrId('Ethereum', { symbol: 'WETH.e' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = getAssetBySymbolOrId('Ethereum', { symbol: Foreign('WETH.e') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on Ethereum', () => {
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WETH.e' }, false, 'Ethereum')
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
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WETH' }, false, 'Ethereum')
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
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: Foreign('MON.e') })
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
    getAssetBySymbolOrId('AssetHubPolkadot', { symbol: Foreign('MON.e') })
  })

  it('Should find asset ending with .e on Ethereum when entered withou suffix', () => {
    vi.spyOn(assetFunctions, 'getOtherAssets').mockReturnValue([
      {
        assetId: '1',
        symbol: 'WETH.e'
      }
    ])
    const asset = getAssetBySymbolOrId(
      'AssetHubPolkadot',
      { symbol: Foreign('WETH') },
      false,
      'Ethereum'
    )
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
    const asset = getAssetBySymbolOrId('Ethereum', { symbol: Foreign('WETH') })
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
    const asset = getAssetBySymbolOrId('Ethereum', { symbol: Foreign('WETH.e') }, false, 'Ethereum')
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
    const asset = getAssetBySymbolOrId('Ethereum', { symbol: Foreign('WETH') }, false, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot with duplicates', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockImplementation(node => {
      return node === 'Ethereum'
        ? {
            nativeAssetSymbol: 'ETH',
            relayChainAssetSymbol: 'DOT',
            otherAssets: [],
            nativeAssets: []
          }
        : {
            nativeAssetSymbol: 'DOT',
            relayChainAssetSymbol: 'DOT',
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
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WTH.e' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset ending with .e on AssetHubPolkadot ', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockImplementation(node => {
      return node === 'Ethereum'
        ? {
            nativeAssetSymbol: 'ETH',
            relayChainAssetSymbol: 'DOT',
            otherAssets: [],
            nativeAssets: []
          }
        : {
            nativeAssetSymbol: 'DOT',
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
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WTH.e' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset with xc prefix on Astar', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
          decimals: 10
        }
      ]
    })
    const asset = getAssetBySymbolOrId('Astar', { symbol: 'xcDOT' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).not.toHaveProperty('assetId')
  })

  it('Should throw error when duplicate dot asset on Hydration', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockResolvedValueOnce({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    expect(() => getAssetBySymbolOrId('Hydration', { symbol: 'HDX' })).toThrow()
  })

  it('should throw error when multiple assets found for symbol after stripping "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    expect(() => getAssetBySymbolOrId('Hydration', { symbol: 'xcDOT' })).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    expect(() => getAssetBySymbolOrId('Hydration', { symbol: 'GLMR' })).toThrow()
  })

  it('should throw error when multiple assets found for symbol after adding "xc" prefix', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    expect(() => getAssetBySymbolOrId('Hydration', { symbol: Foreign('DOT') })).toThrow()
  })

  it('should find asset with xc prefix on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      otherAssets: [
        {
          assetId: '2',
          symbol: 'xcDOT'
        }
      ],
      nativeAssets: []
    })
    const asset = getAssetBySymbolOrId('Acala', { symbol: Foreign('DOT') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find ethereum assets', () => {
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WETH' }, false, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find native asset on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      otherAssets: [],
      nativeAssets: [
        {
          symbol: 'DOT',
          decimals: 10
        }
      ]
    })
    const asset = getAssetBySymbolOrId('Acala', { symbol: Native('DOT') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('decimals')
  })

  it('should find foreign abstract asset on Acala', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    const asset = getAssetBySymbolOrId('Acala', { symbol: ForeignAbstract('DOT1') })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should throw error when multiple matches in native and foreign assets', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
          decimals: 10
        }
      ]
    })
    expect(() => getAssetBySymbolOrId('Acala', { symbol: Foreign('DOT') })).toThrow()
  })

  it('should find asset with lowercase matching', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      otherAssets: [
        {
          assetId: '2',
          symbol: 'glmr',
          alias: 'glmr2'
        }
      ],
      nativeAssets: []
    })
    const asset = getAssetBySymbolOrId('Acala', { symbol: 'Glmr' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset dot native asset when specifier not present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      otherAssets: [],
      nativeAssets: []
    })
    const asset = getAssetBySymbolOrId('Acala', { symbol: 'dot' })
    expect(asset).toHaveProperty('symbol')
    expect(asset?.symbol).toBe('DOT')
    expect(asset).not.toHaveProperty('assetId')
    expect(asset).toHaveProperty('decimals')
  })

  it('Should return null when passing a multilocation currency that is not present', () => {
    const asset = getAssetBySymbolOrId('Astar', {
      multilocation: {
        parents: 1,
        interior: {
          X1: {
            PalletInstance: 1
          }
        }
      }
    })
    expect(asset).toBeNull()
  })

  it('should return asset when passing a multilocation currency that is present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    const asset = getAssetBySymbolOrId('Astar', {
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
    })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should return asset when passing a multilocation currency that is present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    const asset = getAssetBySymbolOrId('Astar', {
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
    })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should return asset when passing a multilocation currency with commas that is present', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
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
    const asset = getAssetBySymbolOrId('Astar', {
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
    })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset by xcm interior - string', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
          xcmInterior: [
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
      ],
      nativeAssets: []
    })
    const asset = getAssetBySymbolOrId('Astar', {
      multilocation: JSON.stringify([
        {
          Parachain: '1000'
        },
        {
          PalletInstance: '50'
        },
        {
          GeneralIndex: '1984'
        }
      ])
    })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('should find asset by xcm interior - array', () => {
    vi.spyOn(assetFunctions, 'getAssetsObject').mockReturnValue({
      nativeAssetSymbol: 'DOT',
      relayChainAssetSymbol: 'DOT',
      otherAssets: [
        {
          assetId: '2',
          symbol: 'dot',
          xcmInterior: [
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
      ],
      nativeAssets: []
    })
    const asset = getAssetBySymbolOrId('Astar', {
      multilocation: [
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
    })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })
})
