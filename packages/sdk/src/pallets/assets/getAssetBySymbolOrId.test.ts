// Contains tests for different Asset queries used in XCM call creation

import { afterEach, describe, expect, it, vi } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'
import * as assetFunctions from './assets'
import { getDefaultPallet } from '../pallets'
import { isRelayChain } from '../../utils'
import type { TNodePolkadotKusama } from '../../types'

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
            const asset = getAssetBySymbolOrId(node, { symbol: other.symbol })
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
          if (otherAssetsMatchesById.length > 1) {
            expect(() => getAssetBySymbolOrId(node, { id: other.assetId })).toThrow()
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
          const asset = getAssetBySymbolOrId(node, { id: other.assetId })
          expect(asset).toHaveProperty('assetId')
          expect(other.assetId).toEqual(asset?.assetId)
        }
      })
    })
  })

  it('should return symbol for every native foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        if (other.assetId !== undefined) {
          const asset = getAssetBySymbolOrId(node, { id: other.assetId })
          expect(asset).toHaveProperty('symbol')
          expect(asset).toHaveProperty('assetId')
          expect(Number(other.assetId)).toEqual(asset?.assetId)
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
    const asset = getAssetBySymbolOrId('AssetHubKusama', { symbol: 'PNEO' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = getAssetBySymbolOrId('Moonbeam', { symbol: 'xcZTG' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should find asset starting with "xc" for Moonbeam', () => {
    const asset = getAssetBySymbolOrId('Moonbeam', { symbol: 'xcWETH.e' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
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
          symbol: 'xcDOT'
        },
        {
          assetId: '2',
          symbol: 'xcDOT'
        }
      ],
      nativeAssets: []
    })
    expect(() => getAssetBySymbolOrId('Hydration', { symbol: 'DOT' })).toThrow()
  })

  it('Should find ethereum assets', () => {
    const asset = getAssetBySymbolOrId('AssetHubPolkadot', { symbol: 'WETH' }, false, 'Ethereum')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })

  it('Should return null when passing a multilocation currency', () => {
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
})
