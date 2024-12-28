// Contains tests for querying Parachain XCM Pallets compatibility

import { describe, expect, it } from 'vitest'
import { NODE_NAMES_DOT_KSM, SUPPORTED_PALLETS } from '../constants'
import { type TNode, type TPallet } from '../types'
import { getDefaultPallet, getSupportedPallets } from './pallets'

describe('getDefaultPallet', () => {
  it('should return default pallet for all nodes', () => {
    NODE_NAMES_DOT_KSM.forEach(node => {
      const pallet = getDefaultPallet(node)
      expect(pallet).toBeTypeOf('string')
      const res = SUPPORTED_PALLETS.includes(pallet)
      expect(res).toBeTruthy()
    })
  })

  it('should return xTokens pallet for Acala', () => {
    const node: TNode = 'Acala'
    const defaultPallet: TPallet = 'XTokens'
    const pallet = getDefaultPallet(node)
    expect(pallet).toEqual(defaultPallet)
  })
})

describe('getSupportedPallets', () => {
  it('should return supported pallets for all nodes', () => {
    NODE_NAMES_DOT_KSM.forEach(node => {
      const pallets = getSupportedPallets(node)
      pallets.forEach(pallet => {
        const res = SUPPORTED_PALLETS.includes(pallet)
        expect(res).toBeTruthy()
      })
    })
  })

  it('should return PolkadotXcm, Xtokens pallets for Acala', () => {
    const node: TNode = 'Acala'
    const supportedPallets: TPallet[] = ['PolkadotXcm', 'XTokens']
    const pallets = getSupportedPallets(node)
    expect(pallets).toEqual(supportedPallets)
  })
})
