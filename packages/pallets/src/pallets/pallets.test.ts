// Contains tests for querying Parachain XCM Pallets compatibility

import type { TChain } from '@paraspell/sdk-common'
import { SUBSTRATE_CHAINS } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { ASSETS_PALLETS, PALLETS } from '../constants'
import { type TPallet } from '../types'
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
  getPalletIndex,
  getSupportedPallets,
  getSupportedPalletsDetails
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
