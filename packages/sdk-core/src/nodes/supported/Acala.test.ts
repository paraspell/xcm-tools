import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils/getNode'
import type Acala from './Acala'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

vi.mock('../config', () => ({
  getNodeProviders: vi.fn()
}))

describe('Acala', () => {
  let acala: Acala<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'ACA', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    acala = getNode<unknown, unknown, 'Acala'>('Acala')
  })

  it('should initialize with correct values', () => {
    expect(acala.node).toBe('Acala')
    expect(acala.info).toBe('acala')
    expect(acala.type).toBe('polkadot')
    expect(acala.version).toBe(Version.V4)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    acala.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { Token: 'ACA' })
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    const inputWithCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'ACA',
        assetId: '1',
        amount: '100'
      }
    }

    acala.transferXTokens(inputWithCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
    })
  })

  it('should call transferLocalNativeAsset', () => {
    const mockApi = {
      callTxMethod: vi.fn()
    }

    const mockOptions = {
      api: mockApi,
      asset: { symbol: 'ACA', amount: '100' },
      address: 'address'
    } as unknown as TTransferLocalOptions<unknown, unknown>

    acala.transferLocalNativeAsset(mockOptions)

    expect(mockApi.callTxMethod).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer_native_currency',
      parameters: {
        dest: { Id: 'address' },
        amount: BigInt('100')
      }
    })
  })

  it('should call transferLocalNonNativeAsset', () => {
    const mockApi = {
      callTxMethod: vi.fn()
    }

    const mockOptions = {
      api: mockApi,
      asset: { symbol: 'ACA', amount: '100', assetId: '1' },
      address: 'address'
    } as unknown as TTransferLocalOptions<unknown, unknown>

    acala.transferLocalNonNativeAsset(mockOptions)

    expect(mockApi.callTxMethod).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer',
      parameters: {
        dest: { Id: 'address' },
        currency_id: { ForeignAsset: 1 },
        amount: BigInt('100')
      }
    })
  })
})
