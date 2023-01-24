import { describe, expect, it } from 'vitest'
import { NODE_NAMES, SUPPORTED_PALLETS } from '../maps/consts'
import { getDefaultPallet, getSupportedPallets } from './pallets'

describe('getDefaultPallet', () => {
  it('should return default pallet for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const pallet = getDefaultPallet(node)
      expect(pallet).toBeTypeOf('string')
      const res = SUPPORTED_PALLETS.includes(pallet)
      expect(res).toBeTruthy()
    })
  })
})

describe('getSupportedPallets', () => {
  it('should return supported pallets for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const pallets = getSupportedPallets(node)
      pallets.forEach(pallet => {
        const res = SUPPORTED_PALLETS.includes(pallet)
        expect(res).toBeTruthy()
      })
    })
  })
})
