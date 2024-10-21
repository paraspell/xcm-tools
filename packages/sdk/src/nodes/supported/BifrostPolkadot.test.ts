import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type { BifrostPolkadot } from './BifrostPolkadot'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('BifrostPolkadot', () => {
  let bifrostPolkadot: BifrostPolkadot
  const mockInput = {
    currency: 'BNC',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    bifrostPolkadot = getNode('BifrostPolkadot')
    vi.resetAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(bifrostPolkadot.node).toBe('BifrostPolkadot')
    expect(bifrostPolkadot.name).toBe('bifrost')
    expect(bifrostPolkadot.type).toBe('polkadot')
    expect(bifrostPolkadot.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostPolkadot.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { Native: 'BNC' })
  })

  it('should call transferXTokens with Token when currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('NOT_BNC')

    bifrostPolkadot.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { Token: 'BNC' })
  })

  it('should call transferXTokens with VSToken', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('NOT_BNC')

    const input = {
      ...mockInput,
      currency: 'vsDOT',
      currencyID: '0'
    }

    bifrostPolkadot.transferXTokens(input)

    expect(spy).toHaveBeenCalledWith(input, { VSToken2: 0 })
  })

  it('should throw error when currency symbol is undefined', () => {
    expect(() =>
      bifrostPolkadot.transferXTokens({ ...mockInput, currency: undefined })
    ).toThrowError('Currency symbol is undefined')
  })
})
