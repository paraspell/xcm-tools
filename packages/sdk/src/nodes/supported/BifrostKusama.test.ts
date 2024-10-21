import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type BifrostKusama from './BifrostKusama'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('BifrostKusama', () => {
  let bifrostKusama: BifrostKusama
  const mockInput = {
    currency: 'BNC',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    bifrostKusama = getNode('BifrostKusama')
  })

  it('should initialize with correct values', () => {
    expect(bifrostKusama.node).toBe('BifrostKusama')
    expect(bifrostKusama.name).toBe('bifrost')
    expect(bifrostKusama.type).toBe('kusama')
    expect(bifrostKusama.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bifrostKusama, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostKusama.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { Native: 'BNC' })
  })

  it('should call transferXTokens with Token when currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bifrostKusama, 'getNativeAssetSymbol').mockReturnValue('NOT_BNC')

    bifrostKusama.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { Native: 'BNC' })
  })
})
