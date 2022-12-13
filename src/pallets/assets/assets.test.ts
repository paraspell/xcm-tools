import { describe, expect, it } from 'vitest'
import { nodeNames } from '../../maps/consts'
import { getAllAssetsSymbols, getAssetId, getAssetsObject, getNativeAssets, getOtherAssets, getRelayChainSymbol } from './assets'

describe('getAssetsObject', () => {
  it('should return assets object for all nodes', () => {
    nodeNames.forEach((node) => {
      const assets = getAssetsObject(node)
      expect(assets).toEqual(expect.objectContaining({
        relayChainAssetSymbol: expect.any(String),
        nativeAssets: expect.any(Array),
        otherAssets: expect.any(Array)
      }))
    })
  })
})

describe('getAssetId', () => {
  it('should return id of BTC from statemine', () => {
    const assetId = getAssetId('Statemine', 'BTC')
    expect(assetId).toEqual('9999')
  })

  it('should return null for not existing assetId', () => {
    const assetId = getAssetId('Statemine', 'BTG')
    expect(assetId).toBeNull()
  })
})

describe('getRelayChainSymbol', () => {
  it('should return relay chain currency symbol for Statemine', () => {
    const assetId = getRelayChainSymbol('Statemine')
    expect(assetId).toEqual('KSM')
  })
  it('should return relay chain currency symbol for Statemint', () => {
    const assetId = getRelayChainSymbol('Statemint')
    expect(assetId).toEqual('DOT')
  })
  it('should return relay chain currency symbol for all nodes', () => {
    nodeNames.forEach((node) => {
      const assetId = getRelayChainSymbol(node)
      expect(assetId).toBeTypeOf('string')
    })
  })
})

describe('getNativeAssets', () => {
  it('should return native assets for all nodes', () => {
    nodeNames.forEach((node) => {
      const assets = getNativeAssets(node)
      expect(assets.length).toBeGreaterThan(0)
      assets.forEach(asset => expect(asset).toBeTypeOf('string'))
      })
    })
  })

describe('getOtherAssets', () => {
  it('should return other assets or empty array for all nodes', () => {
    nodeNames.forEach((node) => {
      const assets = getOtherAssets(node)
      expect(assets).toBeInstanceOf(Array)
    })
  })
})

describe('getAllAssetsSymbols', () => {
  it('should return all assets symbols for all nodes', () => {
    nodeNames.forEach((node) => {
      const assets = getAllAssetsSymbols(node)
      expect(assets).toBeInstanceOf(Array)
      assets.forEach(asset => expect(asset).toBeTypeOf('string'))
    })
  })
})
