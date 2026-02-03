import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type Ajuna from './Ajuna'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../transfer')

describe('Ajuna', () => {
  let chain: Ajuna<unknown, unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'BNC', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Ajuna'>('Ajuna')
    vi.clearAllMocks()
  })

  it('exposes the correct static metadata', () => {
    expect(chain.chain).toBe('Ajuna')
    expect(chain.info).toBe('ajuna')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

    it('creates local transfer', () => {
      const opts = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(opts)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 1,
          target: { Id: 'addr' },
          amount: 100n
        }
      })
    })

    it('calls transfer_all when amount is ALL', () => {
      const opts = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr',
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(opts)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: 1,
          dest: { Id: 'addr' },
          keep_alive: false
        }
      })
    })
  })
})
