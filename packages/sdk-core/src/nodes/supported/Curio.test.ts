import type { TNativeAsset, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TForeignOrTokenAsset, TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type Curio from './Curio'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Curio', () => {
  let curio: Curio<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'CUR',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    curio = getNode<unknown, unknown, 'Curio'>('Curio')
  })

  it('should initialize with correct values', () => {
    expect(curio.node).toBe('Curio')
    expect(curio.info).toBe('curio')
    expect(curio.type).toBe('kusama')
    expect(curio.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    curio.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 123
    } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'CUR',
        amount: 100n,
        isNative: true
      } as WithAmount<TNativeAsset>
    }

    curio.transferXTokens(inputWithoutCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'CUR'
    } as TForeignOrTokenAsset)
  })
})
