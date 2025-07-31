// Contains tests for querying Parachain XCM Pallets compatibility

import type { TChain } from '@paraspell/sdk-common'
import { CHAIN_NAMES_DOT_KSM } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { SUPPORTED_PALLETS } from '../constants'
import { type TPallet } from '../types'
import {
  getDefaultPallet,
  getPalletIndex,
  getSupportedPallets,
  getSupportedPalletsDetails
} from '.'

describe('getDefaultPallet', () => {
  it('should return default pallet for all chains', () => {
    CHAIN_NAMES_DOT_KSM.forEach(chain => {
      const pallet = getDefaultPallet(chain)
      expect(pallet).toBeTypeOf('string')
      const res = SUPPORTED_PALLETS.includes(pallet)
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
    CHAIN_NAMES_DOT_KSM.forEach(chain => {
      const pallets = getSupportedPallets(chain)
      pallets.forEach(pallet => {
        const res = SUPPORTED_PALLETS.includes(pallet)
        expect(res).toBeTruthy()
      })
    })
  })

  it('should return PolkadotXcm, Xtokens pallets for Acala', () => {
    const chain: TChain = 'Acala'
    const supportedPallets: TPallet[] = ['PolkadotXcm', 'XTokens']
    const pallets = getSupportedPallets(chain)
    expect(pallets).toEqual(supportedPallets)
  })
})

describe('getSupportedPalletsDetails', () => {
  it('should return supported pallets details for all chains', () => {
    CHAIN_NAMES_DOT_KSM.forEach(chain => {
      const pallets = getSupportedPalletsDetails(chain)
      pallets.forEach(pallet => {
        const res = SUPPORTED_PALLETS.includes(pallet.name)
        expect(pallet.index).toBeTypeOf('number')
        expect(res).toBeTruthy()
      })
    })
  })
})

describe('getPalletIndex', () => {
  it('should return pallet index for all chains', () => {
    CHAIN_NAMES_DOT_KSM.forEach(chain => {
      getSupportedPallets(chain).forEach(pallet => {
        const index = getPalletIndex(chain, pallet)
        expect(index).toBeTypeOf('number')
      })
    })
  })

  it('should return undefined for unsupported pallets', () => {
    CHAIN_NAMES_DOT_KSM.forEach(chain => {
      const index = getPalletIndex(chain, 'RelayerXcm')
      expect(index).toBeUndefined()
    })
  })
})
