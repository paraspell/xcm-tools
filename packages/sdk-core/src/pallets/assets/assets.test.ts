// Contains tests for different Asset operation functions

import { describe, expect, it } from 'vitest'

import { NODE_NAMES, NODE_NAMES_DOT_KSM } from '../../constants'
import { getParaId } from '../../nodes/config'
import type { TEcosystemType } from '../../types'
import { getNode } from '../../utils'
import {
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetsObject,
  getNativeAssets,
  getOtherAssets,
  getRelayChainSymbol,
  getTNode,
  hasSupportForAsset
} from './assets'

describe('getAssetsObject', () => {
  it('should return assets object for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const assets = getAssetsObject(node)
      expect(assets).toEqual(
        expect.objectContaining({
          relayChainAssetSymbol: expect.any(String),
          nativeAssets: expect.any(Array),
          otherAssets: expect.any(Array)
        })
      )
    })
  })
})

describe('getAssetId', () => {
  it('should return id of BTC from AssetHubKusama', () => {
    const assetId = getAssetId('AssetHubKusama', 'USDt')
    expect(assetId).toEqual('1984')
  })

  it('should return null for not existing assetId', () => {
    const assetId = getAssetId('AssetHubKusama', 'BTG')
    expect(assetId).toBeNull()
  })
})

describe('getRelayChainSymbol', () => {
  it('should return relay chain currency symbol for AssetHubKusama', () => {
    const assetId = getRelayChainSymbol('AssetHubKusama')
    expect(assetId).toEqual('KSM')
  })
  it('should return relay chain currency symbol for AssetHubPolkadot', () => {
    const assetId = getRelayChainSymbol('AssetHubPolkadot')
    expect(assetId).toEqual('DOT')
  })
  it('should return relay chain currency symbol for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const assetId = getRelayChainSymbol(node)
      expect(assetId).toBeTypeOf('string')
    })
  })
})

describe('getNativeAssets', () => {
  it('should return native assets for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const assets = getNativeAssets(node)
      if (node !== 'Ethereum') expect(assets.length).toBeGreaterThan(0)
      assets.forEach(asset => {
        expect(asset).toBeTypeOf('object')
        expect(asset).toHaveProperty('symbol')
        expect(asset).toHaveProperty('decimals')
      })
    })
  })
})

describe('getOtherAssets', () => {
  it('should return other assets or empty array for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const assets = getOtherAssets(node)
      expect(assets).toBeInstanceOf(Array)
      assets.forEach(asset => {
        expect(asset).toBeTypeOf('object')
        if (!asset.multiLocation) expect(asset).toHaveProperty('assetId')
      })
    })
  })
})

describe('getAllAssetsSymbols', () => {
  it('should return all assets symbols for node or empty array', () => {
    NODE_NAMES.forEach(node => {
      const assetsSymbols = getAllAssetsSymbols(node)
      expect(assetsSymbols).toBeInstanceOf(Array)
      assetsSymbols.forEach(assetSymbol => {
        expect(assetSymbol).toBeTypeOf('string')
      })
    })
  })
})

describe('getAssetDecimals', () => {
  it('should return valid decimals for all available assets', () => {
    NODE_NAMES.forEach(node => {
      // Ethereum assets do not have asset decimals available
      if (node === 'Ethereum') return
      const obj = getAssetsObject(node)
      expect(obj).not.toBeNull()
      ;[...obj.nativeAssets, ...obj.otherAssets].forEach(asset => {
        if (asset.symbol !== undefined) {
          const decimals = getAssetDecimals(node, asset.symbol)
          expect(decimals).toBeTypeOf('number')
          expect(decimals).toBeGreaterThanOrEqual(0)
        }
      })
    })
  })
})

describe('getSupportedAssets', () => {
  it('should return supported assets for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const assets = getAssetsObject(node)
      expect(assets).toEqual(
        expect.objectContaining({
          relayChainAssetSymbol: expect.any(String),
          nativeAssets: expect.any(Array),
          otherAssets: expect.any(Array)
        })
      )
    })
  })
})

describe('getTNode', () => {
  it('should return supported assets for all nodes', () => {
    ;(['polkadot', 'kusama'] as TEcosystemType[]).forEach(ecosystem => {
      NODE_NAMES_DOT_KSM.filter(node => getNode(node).type === ecosystem).forEach(node => {
        const paraId = getParaId(node)
        if (paraId === undefined) return
        const nodeName = getTNode(paraId, ecosystem)
        expect(nodeName).toEqual(node)
      })
    })
  })

  it('should return Polkadot for paraId 0', () => {
    const nodeName = getTNode(0, 'polkadot')
    expect(nodeName).toEqual('Polkadot')
  })

  it('should return Kusama for paraId 0', () => {
    const nodeName = getTNode(0, 'kusama')
    expect(nodeName).toEqual('Kusama')
  })

  it('should return Ethereum for paraId 1', () => {
    const nodeName = getTNode(1, 'kusama')
    expect(nodeName).toEqual('Ethereum')
  })

  it('should return null for not existing paraId', () => {
    const nodeName = getTNode(9999, 'kusama')
    expect(nodeName).toBeNull()
  })
})

describe('hasSupportForAsset', () => {
  it('should return true for .e suffixed asset', () => {
    const hasSupport = hasSupportForAsset('AssetHubPolkadot', 'WETH.e')
    expect(hasSupport).toBe(true)
  })
})
