import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXcmAsset, TXTokensTransferOptions } from '../../types'
import { getChain, getLocalTransferAmount } from '../../utils'
import type Pendulum from './Pendulum'

vi.mock('../../pallets/xTokens')
vi.mock('../../utils/transfer')

describe('Pendulum', () => {
  let chain: Pendulum<unknown, unknown, unknown>

  const mockInput = {
    asset: { symbol: 'PEN', assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown, unknown>

  const mockDOTInput = {
    asset: { symbol: 'DOT', assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown, unknown>

  const mockApi = {
    deserializeExtrinsics: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Pendulum'>('Pendulum')
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
    } as TXTokensTransferOptions<unknown, unknown, unknown>

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

  it('should call transferLocalNonNativeAsset', () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
      recipient: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown, unknown>

    vi.mocked(getLocalTransferAmount).mockReturnValue(100n)

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    chain.transferLocalNonNativeAsset(mockOptions)

    expect(spy).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: 'address' },
        currency_id: { XCM: 1 },
        amount: 100n
      }
    })
  })
})
