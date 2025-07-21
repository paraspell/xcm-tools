import { InvalidCurrencyError } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'
import { replaceBigInt, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TXcmAsset, TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type Pendulum from './Pendulum'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))
vi.mock('@paraspell/assets', async () => {
  const actual = await vi.importActual<typeof import('@paraspell/assets')>('@paraspell/assets')
  return {
    ...actual,
    isForeignAsset: vi.fn()
  }
})

describe('Pendulum', () => {
  let pendulum: Pendulum<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'PEN', assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  const mockDOTInput = {
    asset: { symbol: 'DOT', assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    pendulum = getNode<unknown, unknown, 'Pendulum'>('Pendulum')
    vi.spyOn(pendulum, 'getNativeAssetSymbol').mockReturnValue('PEN')
  })

  it('should initialize with correct values', () => {
    expect(pendulum.node).toBe('Pendulum')
    expect(pendulum.info).toBe('pendulum')
    expect(pendulum.type).toBe('polkadot')
    expect(pendulum.version).toBe(Version.V3)
  })

  it('should call transferXTokens with native asset', () => {
    pendulum.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith({ ...mockInput, useMultiAssetTransfer: false }, {
      Native: null
    } as TXcmAsset)
  })

  it('should call transferXTokens with XCM asset when foreign asset is provided', () => {
    const foreignAssetInput = {
      asset: { symbol: 'USDC', assetId: '456', amount: 200n },
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    pendulum.transferXTokens(foreignAssetInput)

    expect(transferXTokens).toHaveBeenCalledWith(
      { ...foreignAssetInput, useMultiAssetTransfer: false },
      { XCM: 456 }
    )
  })

  it('Should call transferXTokens with useMultiAssetTransfer for DOT asset', () => {
    pendulum.transferXTokens(mockDOTInput)
    expect(transferXTokens).toHaveBeenCalledWith(
      { ...mockDOTInput, useMultiAssetTransfer: true },
      { XCM: 123 }
    )
  })

  it('should throw InvalidCurrencyError for asset without assetId and not foreign', () => {
    const invalidAssetInput = {
      asset: { symbol: 'FAKE', amount: 50n }, // missing assetId
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    expect(() => pendulum.transferXTokens(invalidAssetInput)).toThrowError(
      new InvalidCurrencyError(
        `Asset ${JSON.stringify(invalidAssetInput.asset, replaceBigInt)} has no assetId`
      )
    )
  })
})
