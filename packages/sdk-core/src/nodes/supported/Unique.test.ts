import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils/getNode'
import type Unique from './Unique'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Unique', () => {
  let unique: Unique<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'GLMR', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    unique = getNode<unknown, unknown, 'Unique'>('Unique')
  })

  it('should initialize with correct values', () => {
    expect(unique.node).toBe('Unique')
    expect(unique.info).toBe('unique')
    expect(unique.type).toBe('polkadot')
    expect(unique.version).toBe(Version.V5)
  })

  it('should call transferXTokens with asset id', () => {
    unique.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 123)
  })

  it('should call transferXTokens with NativeAssetId', () => {
    const input = {
      asset: {
        ...mockInput.asset,
        symbol: 'UNQ'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    unique.transferXTokens(input)
    expect(transferXTokens).toHaveBeenCalledWith(input, 0)
  })

  it('should throw InvalidCurrencyError if asset has no assetId', () => {
    const input = {
      asset: {
        symbol: 'DOT'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    expect(() => unique.transferXTokens(input)).toThrowError()
  })

  it('should throw an error when trying to create a local foreign asset transfer', () => {
    const input = {
      api: {} as unknown as IPolkadotApi<unknown, unknown>,
      asset: {
        symbol: 'GLMR',
        assetId: '123'
      },
      to: 'Unique'
    } as TTransferLocalOptions<unknown, unknown>

    expect(() => unique.transferLocalNonNativeAsset(input)).toThrowError(ScenarioNotSupportedError)
  })
})
