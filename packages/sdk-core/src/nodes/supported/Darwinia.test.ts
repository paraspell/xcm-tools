import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version } from '../../types'
import { NodeNotSupportedError } from '../../errors'
import type Darwinia from './Darwinia'
import { getNode } from '../../utils'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createCurrencySpec: vi.fn()
}))

describe('Darwinia', () => {
  let darwinia: Darwinia<unknown, unknown>

  beforeEach(() => {
    darwinia = getNode<unknown, unknown, 'Darwinia'>('Darwinia')
  })

  it('should initialize with correct values', () => {
    expect(darwinia.node).toBe('Darwinia')
    expect(darwinia.info).toBe('darwinia')
    expect(darwinia.type).toBe('polkadot')
    expect(darwinia.version).toBe(Version.V3)
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => darwinia.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
