import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TXcmAsset, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Pendulum from './Pendulum'

vi.mock('../../pallets/xTokens')

describe('Pendulum', () => {
  let chain: Pendulum<unknown, unknown>

  const mockInput = {
    asset: { symbol: 'PEN', assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  const mockDOTInput = {
    asset: { symbol: 'DOT', assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Pendulum'>('Pendulum')
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('PEN')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Pendulum')
    expect(chain.info).toBe('pendulum')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  it('should call transferXTokens with native asset', () => {
    chain.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith({ ...mockInput, useMultiAssetTransfer: false }, {
      Native: null
    } as TXcmAsset)
  })

  it('should call transferXTokens with XCM asset when foreign asset is provided', () => {
    const foreignAssetInput = {
      asset: { symbol: 'USDC', assetId: '456', amount: 200n },
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    chain.transferXTokens(foreignAssetInput)

    expect(transferXTokens).toHaveBeenCalledWith(
      { ...foreignAssetInput, useMultiAssetTransfer: false },
      { XCM: 456 }
    )
  })

  it('Should call transferXTokens with useMultiAssetTransfer for DOT asset', () => {
    chain.transferXTokens(mockDOTInput)
    expect(transferXTokens).toHaveBeenCalledWith(
      { ...mockDOTInput, useMultiAssetTransfer: true },
      { XCM: 123 }
    )
  })
})
