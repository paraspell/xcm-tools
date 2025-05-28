import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils/getNode'
import type Peaq from './Peaq'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Peaq', () => {
  let peaq: Peaq<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: '100' },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    peaq = getNode<unknown, unknown, 'Peaq'>('Peaq')
  })

  it('should initialize with correct values', () => {
    expect(peaq.node).toBe('Peaq')
    expect(peaq.info).toBe('peaq')
    expect(peaq.type).toBe('polkadot')
    expect(peaq.version).toBe(Version.V3)
  })

  it('should call transferXTokens with valid scenario', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    peaq.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 123n)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TXTokensTransferOptions<
      unknown,
      unknown
    >

    expect(() => peaq.transferXTokens(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => peaq.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => peaq.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => peaq.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      peaq.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        section: 'transfer',
        parameters: {
          target: { Id: mockOptions.address },
          id: 1n,
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
