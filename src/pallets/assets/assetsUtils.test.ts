// Contains tests for different Asset queries used in XCM call creation

import { describe, expect, it } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { getAssetsObject } from './assets'
import { getAssetBySymbolOrId } from './assetsUtils'

describe('getAssetBySymbolOrId', () => {
  it('should return assetId and symbol for every foreign asset', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)
      otherAssets.forEach(other => {
        if (other.symbol) {
          const asset = getAssetBySymbolOrId(node, other.symbol)
          expect(asset).toHaveProperty('symbol')
          expect(other.symbol).toEqual(asset?.symbol)
          expect(asset).toHaveProperty('assetId')
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        const asset = getAssetBySymbolOrId(node, other.symbol)
        expect(other.symbol).toEqual(asset?.symbol)
        expect(asset).toHaveProperty('symbol')
      })
    })
  })

  it('should return assetId and symbol for every native foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)
      otherAssets.forEach(other => {
        const asset = getAssetBySymbolOrId(node, other.assetId)
        expect(asset).toHaveProperty('symbol')
        expect(asset).toHaveProperty('assetId')
        expect(Number(other.assetId)).toEqual(asset?.assetId)
      })
    })
  })

  it('should return symbol for every native foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        if (other.assetId) {
          const asset = getAssetBySymbolOrId(node, other.assetId)
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
      const asset = getAssetBySymbolOrId(node, relayChainAssetSymbol)
      expect(asset).toHaveProperty('symbol')
    })
  })

  it('should find assetId for KSM asset in AssetHubKusama', () => {
    const asset = getAssetBySymbolOrId('AssetHubKusama', 'KSM')
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })
})
