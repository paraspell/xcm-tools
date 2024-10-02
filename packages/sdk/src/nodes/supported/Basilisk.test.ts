import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput, TNodePolkadotKusama } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getAllNodeProviders } from '../../utils'
import { getNode } from '../../utils/getNode'
import Basilisk from './Basilisk'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../utils', () => ({
  getAllNodeProviders: vi.fn()
}))

describe('Basilisk', () => {
  let basilisk: Basilisk
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  const mockProviders = ['wss://non-preferred-rpc', 'wss://preferred-dwellir-rpc']

  beforeEach(() => {
    basilisk = getNode('Basilisk')
    vi.mocked(getAllNodeProviders).mockReturnValue(mockProviders)
  })

  it('should initialize with correct values', () => {
    expect(basilisk.node).toBe('Basilisk')
    expect(basilisk.name).toBe('basilisk')
    expect(basilisk.type).toBe('kusama')
    expect(basilisk.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    basilisk.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })

  it('should return the second provider URL from getProvider', () => {
    const provider = basilisk.getProvider()

    expect(getAllNodeProviders).toHaveBeenCalledWith(basilisk.node as TNodePolkadotKusama)
    expect(provider).toBe('wss://preferred-dwellir-rpc')
  })
})
