// Contains tests for different Asset operation functions

import { CHAINS, isExternalChain } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TChainAssetsInfo, TCustomCtx } from '../types'
import {
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetsImpl,
  getAssetsObject,
  getAssetsObjectImpl,
  getNativeAssets,
  getNativeAssetsImpl,
  getOtherAssets,
  getOtherAssetsImpl,
  getRelayChainSymbol,
  hasDryRunSupport,
  hasDryRunSupportImpl,
  hasXcmPaymentApiSupport,
  hasXcmPaymentApiSupportImpl
} from './assets'

describe('getAssetsObject', () => {
  it('should return assets object for all chains', () => {
    CHAINS.forEach(chain => {
      const assets = getAssetsObject(chain)
      expect(assets).toEqual(
        expect.objectContaining({
          relaychainSymbol: expect.any(String),
          assets: expect.any(Array)
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
  it('should return relay chain currency symbol for all chains', () => {
    CHAINS.forEach(chain => {
      const assetId = getRelayChainSymbol(chain)
      expect(assetId).toBeTypeOf('string')
    })
  })
})

describe('getNativeAssets', () => {
  it('should return native assets for all chains', () => {
    CHAINS.forEach(chain => {
      const assets = getNativeAssets(chain)
      if (!isExternalChain(chain)) expect(assets.length).toBeGreaterThan(0)
      assets.forEach(asset => {
        expect(asset).toBeTypeOf('object')
        expect(asset).toHaveProperty('symbol')
        expect(asset).toHaveProperty('decimals')
      })
    })
  })
})

describe('getOtherAssets', () => {
  it('should return other assets or empty array for all chains', () => {
    CHAINS.forEach(chain => {
      const assets = getOtherAssets(chain)
      expect(assets).toBeInstanceOf(Array)
      assets.forEach(asset => {
        expect(asset).toBeTypeOf('object')
      })
    })
  })
})

describe('getAllAssetsSymbols', () => {
  it('should return all assets symbols for chain or empty array', () => {
    CHAINS.forEach(chain => {
      const assetsSymbols = getAllAssetsSymbols(chain)
      expect(assetsSymbols).toBeInstanceOf(Array)
      assetsSymbols.forEach(assetSymbol => {
        expect(assetSymbol).toBeTypeOf('string')
      })
    })
  })
})

describe('getAssetDecimals', () => {
  it('should return valid decimals for all available assets', () => {
    CHAINS.forEach(chain => {
      const obj = getAssetsObject(chain)
      expect(obj).not.toBeNull()
      obj.assets.forEach(asset => {
        const decimals = getAssetDecimals(chain, asset.symbol)
        expect(decimals).toBeTypeOf('number')
        expect(decimals).toBeGreaterThanOrEqual(0)
      })
    })
  })
})

describe('hasDryRunSupport', () => {
  it('should return true for chains with dry run support', () => {
    const hasSupport = hasDryRunSupport('Polkadot')
    expect(hasSupport).toBe(true)
  })

  it('should return false for chains without dry run support', () => {
    const hasSupport = hasDryRunSupport('Peaq')
    expect(hasSupport).toBe(false)
  })
})

describe('hasXcmPaymentApiSupport', () => {
  it('should return true for chains with XCM payment API support', () => {
    const hasSupport = hasXcmPaymentApiSupport('Polkadot')
    expect(hasSupport).toBe(true)
  })

  it('should return false for chains without XCM payment API support', () => {
    const hasSupport = hasXcmPaymentApiSupport('Peaq')
    expect(hasSupport).toBe(false)
  })
})

describe('getAssetsObjectImpl with custom ctx', () => {
  const customNative: TAssetInfo = {
    symbol: 'CUS',
    decimals: 12,
    location: { parents: 0, interior: 'Here' },
    isNative: true
  }

  const customChainAssets: TChainAssetsInfo = {
    relaychainSymbol: 'DOT',
    nativeAssetSymbol: 'CUS',
    isEVM: false,
    ss58Prefix: 42,
    supportsDryRunApi: true,
    supportsXcmPaymentApi: true,
    assets: [customNative]
  }

  it('returns customChainAssets entry for a custom chain name', () => {
    const ctx: TCustomCtx = { customChainAssets: { MyCustom: customChainAssets } }
    expect(getAssetsObjectImpl<'MyCustom'>('MyCustom', ctx)).toBe(customChainAssets)
  })

  it('throws InvalidCurrencyError when a custom chain is not registered in the ctx', () => {
    expect(() => getAssetsObjectImpl<'MyCustom'>('MyCustom', {})).toThrow(InvalidCurrencyError)
    expect(() => getAssetsObjectImpl<'MyCustom'>('MyCustom')).toThrow(InvalidCurrencyError)
  })

  it('merges customAssets overlay into the base when present', () => {
    const overlay: TAssetInfo = {
      symbol: 'EXTRA',
      decimals: 6,
      location: { parents: 1, interior: { X1: { GeneralIndex: '9999' } } }
    }
    const ctx: TCustomCtx = { customAssets: { Acala: [overlay] } }
    const result = getAssetsObjectImpl('Acala', ctx)
    expect(result.assets.find(a => a.symbol === 'EXTRA')).toEqual(overlay)
  })

  it('returns the base unchanged when the overlay is an empty array', () => {
    const base = getAssetsObject('Acala')
    const ctx: TCustomCtx = { customAssets: { Acala: [] } }
    expect(getAssetsObjectImpl('Acala', ctx)).toBe(base)
  })

  it('threads ctx into getAssetsImpl / getNativeAssetsImpl / getOtherAssetsImpl for custom chains', () => {
    const ctx: TCustomCtx = { customChainAssets: { MyCustom: customChainAssets } }
    expect(getAssetsImpl<'MyCustom'>('MyCustom', ctx)).toEqual([customNative])
    expect(getNativeAssetsImpl<'MyCustom'>('MyCustom', ctx)).toEqual([customNative])
    expect(getOtherAssetsImpl<'MyCustom'>('MyCustom', ctx)).toEqual([])
  })

  it('threads ctx into hasDryRunSupportImpl / hasXcmPaymentApiSupportImpl for custom chains', () => {
    const ctx: TCustomCtx = { customChainAssets: { MyCustom: customChainAssets } }
    expect(hasDryRunSupportImpl<'MyCustom'>('MyCustom', ctx)).toBe(true)
    expect(hasXcmPaymentApiSupportImpl<'MyCustom'>('MyCustom', ctx)).toBe(true)
  })
})
