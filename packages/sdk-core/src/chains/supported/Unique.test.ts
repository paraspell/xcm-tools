import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Unique from './Unique'

vi.mock('../../pallets/polkadotXcm')

describe('Unique', () => {
  let chain: Unique<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'GLMR', assetId: '123', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Unique'>('Unique')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Unique')
    expect(chain.info).toBe('unique')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should throw an error when trying to create a local foreign asset transfer', () => {
    const input = {
      api: {} as unknown as PolkadotApi<unknown, unknown, unknown>,
      assetInfo: {
        symbol: 'GLMR',
        assetId: '123'
      },
      to: 'Unique'
    } as TTransferLocalOptions<unknown, unknown, unknown>

    expect(() => chain.transferLocalNonNativeAsset(input)).toThrow(ScenarioNotSupportedError)
  })

  describe('getBalanceForeign', () => {
    const address = '5FbalanceAddr'
    const asset: TAssetInfo = {
      symbol: 'QTZ',
      decimals: 12,
      assetId: '42',
      location: { parents: 1, interior: { X1: [{ Parachain: 2037 }] } }
    }

    it('should return balance.value when present', async () => {
      const queryState = vi.fn().mockResolvedValue(100)
      const queryRuntimeApi = vi.fn().mockResolvedValue({ success: true, value: 500n, ok: 300n })

      const api = { queryState, queryRuntimeApi } as unknown as PolkadotApi<
        unknown,
        unknown,
        unknown
      >

      const balance = await chain.getBalanceForeign(api, address, asset)

      expect(queryState).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'ForeignAssetToCollection',
        params: [asset.location]
      })
      expect(queryRuntimeApi).toHaveBeenCalledWith({
        module: 'UniqueApi',
        method: 'balance',
        params: [100, { Substrate: address }, 42]
      })
      expect(balance).toBe(500n)
    })
  })
})
