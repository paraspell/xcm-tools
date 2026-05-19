// Contains tests for querying Parachain XCM Pallets compatibility

import type { TChain } from '@paraspell/sdk-common'
import { SUBSTRATE_CHAINS } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { ASSETS_PALLETS, PALLETS } from '../constants'
import { XcmPalletNotFoundError } from '../errors'
import type { TCustomChainPallets, TPalletsCtx } from '../types'
import { type TPallet } from '../types'
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
  getPalletIndex,
  getSupportedPallets,
  getSupportedPalletsDetails,
  getXcmPallet,
  hasPallet,
  hasPalletImpl
} from '.'

describe('getDefaultPallet', () => {
  it('should return default pallet for all chains', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      const pallet = getDefaultPallet(chain)
      expect(pallet).toBeTypeOf('string')
      const res = PALLETS.includes(pallet)
      expect(res).toBeTruthy()
    })
  })

  it('should return xTokens pallet for Acala', () => {
    const chain: TChain = 'Acala'
    const defaultPallet: TPallet = 'XTokens'
    const pallet = getDefaultPallet(chain)
    expect(pallet).toEqual(defaultPallet)
  })
})

describe('getSupportedPallets', () => {
  it('should return supported pallets for all chains', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      const pallets = getSupportedPallets(chain)
      pallets.forEach(pallet => {
        const res = PALLETS.includes(pallet)
        expect(res).toBeTruthy()
      })
    })
  })

  it('should return PolkadotXcm, Xtokens pallets for Acala', () => {
    const chain: TChain = 'Acala'
    const supportedPallets: TPallet[] = ['Balances', 'Currencies', 'PolkadotXcm', 'XTokens']
    const pallets = getSupportedPallets(chain)
    expect(pallets).toEqual(supportedPallets)
  })
})

describe('getSupportedPalletsDetails', () => {
  it('should return supported pallets details for all chains', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      const pallets = getSupportedPalletsDetails(chain)
      pallets.forEach(pallet => {
        const res = PALLETS.includes(pallet.name)
        expect(pallet.index).toBeTypeOf('number')
        expect(res).toBeTruthy()
      })
    })
  })
})

describe('getPalletIndex', () => {
  it('should return pallet index for all chains', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      getSupportedPallets(chain).forEach(pallet => {
        const index = getPalletIndex(chain, pallet)
        expect(index).toBeTypeOf('number')
      })
    })
  })
})

describe('getNativeAssetsPallet', () => {
  it('should return native assets pallet for all chains', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      const pallet = getNativeAssetsPallet(chain)
      expect(pallet).toBeTypeOf('string')
      const res = ASSETS_PALLETS.includes(pallet)
      expect(res).toBeTruthy()
    })
  })

  it('should return Balances pallet for Acala', () => {
    const chain: TChain = 'Acala'
    const nativeAssetsPallet: TPallet = 'Balances'
    const pallet = getNativeAssetsPallet(chain)
    expect(pallet).toEqual(nativeAssetsPallet)
  })
})

describe('getOtherAssetsPallets', () => {
  it('should return other assets pallets for all chains', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      const pallets = getOtherAssetsPallets(chain)
      pallets.forEach(pallet => {
        const res = ASSETS_PALLETS.includes(pallet)
        expect(res).toBeTruthy()
      })
    })
  })

  it('should return Assets, ForeignAssets pallets for Acala', () => {
    const chain: TChain = 'Acala'
    const otherAssetsPallets: TPallet[] = ['Currencies', 'Tokens']
    const pallets = getOtherAssetsPallets(chain)
    expect(pallets).toEqual(otherAssetsPallets)
  })
})

describe('XcmPalletNotFoundError', () => {
  it('should create error with correct message and name', () => {
    const error = new XcmPalletNotFoundError('Acala')
    expect(error.message).toBe('No XCM pallet found on chain Acala')
    expect(error.name).toBe('XcmPalletNotFoundError')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('custom chain branches', () => {
  const customPallets: TCustomChainPallets = {
    nativeAssets: 'Balances',
    otherAssets: ['Assets', 'ForeignAssets'],
    supportedPallets: [
      { name: 'Balances', index: 10, hasExtrinsics: true },
      { name: 'PolkadotXcm', index: 31, hasExtrinsics: true }
    ]
  }
  const ctx: TPalletsCtx = { customChainPallets: { MyCustom: customPallets } }

  it('getNativeAssetsPallet returns the registered native pallet for a custom chain', () => {
    expect(getNativeAssetsPallet<'MyCustom'>('MyCustom', ctx)).toBe('Balances')
  })

  it('getNativeAssetsPallet throws when the custom chain is not registered in ctx', () => {
    expect(() => getNativeAssetsPallet<'MyCustom'>('MyCustom')).toThrow(XcmPalletNotFoundError)
  })

  it('getOtherAssetsPallets returns the registered other pallets for a custom chain', () => {
    expect(getOtherAssetsPallets<'MyCustom'>('MyCustom', ctx)).toEqual(['Assets', 'ForeignAssets'])
  })

  it('getOtherAssetsPallets throws when the custom chain is not registered in ctx', () => {
    expect(() => getOtherAssetsPallets<'MyCustom'>('MyCustom')).toThrow(XcmPalletNotFoundError)
  })

  it('hasPalletImpl delegates to the static map for built-in chains', () => {
    expect(hasPalletImpl('Acala', 'PolkadotXcm')).toBe(true)
    expect(hasPalletImpl('Acala', 'XcmPallet')).toBe(false)
  })

  it('hasPalletImpl reads supportedPallets from ctx for custom chains', () => {
    expect(hasPalletImpl<'MyCustom'>('MyCustom', 'PolkadotXcm', ctx)).toBe(true)
    expect(hasPalletImpl<'MyCustom'>('MyCustom', 'XcmPallet', ctx)).toBe(false)
  })

  it('hasPalletImpl returns false for a custom chain not in ctx', () => {
    expect(hasPalletImpl<'MyCustom'>('MyCustom', 'PolkadotXcm')).toBe(false)
  })
})

describe('getXcmPallet', () => {
  it('should return XcmPallet for Polkadot', () => {
    const pallet = getXcmPallet('Polkadot')
    expect(pallet).toEqual('XcmPallet')
  })

  it('should return PolkadotXcm for Acala', () => {
    const pallet = getXcmPallet('Acala')
    expect(pallet).toEqual('PolkadotXcm')
  })

  it('should return a valid XCM pallet for all chains that have one', () => {
    SUBSTRATE_CHAINS.forEach(chain => {
      if (hasPallet(chain, 'XcmPallet') || hasPallet(chain, 'PolkadotXcm')) {
        const pallet = getXcmPallet(chain)
        expect(['XcmPallet', 'PolkadotXcm']).toContain(pallet)
      }
    })
  })

  it('should throw XcmPalletNotFoundError when no XCM pallet exists', () => {
    const chainsWithoutXcm = SUBSTRATE_CHAINS.filter(
      chain => !hasPallet(chain, 'XcmPallet') && !hasPallet(chain, 'PolkadotXcm')
    )
    chainsWithoutXcm.forEach(chain => {
      expect(() => getXcmPallet(chain)).toThrow(XcmPalletNotFoundError)
    })
  })
})
