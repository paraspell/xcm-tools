import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import { getLocalTransferAmount } from '../../utils/transfer'
import type Unique from './Unique'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')

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

  it('should build a unique.transfer call for local foreign asset transfers', () => {
    const deserializeExtrinsics = vi.fn()
    const api = { deserializeExtrinsics } as unknown as PolkadotApi<unknown, unknown, unknown>

    const input = {
      api,
      assetInfo: { symbol: 'DOT', assetId: '437', amount: 100n },
      recipient: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown, unknown>

    vi.mocked(getLocalTransferAmount).mockReturnValue(100n)

    chain.transferLocalNonNativeAsset(input)

    expect(deserializeExtrinsics).toHaveBeenCalledWith({
      module: 'Unique',
      method: 'transfer',
      params: {
        recipient: { Substrate: 'address' },
        collection_id: 437,
        item_id: 0,
        value: 100n
      }
    })
  })

  describe('getBalanceForeign', () => {
    const address = '5FbalanceAddr'
    const asset: TAssetInfo = {
      symbol: 'QTZ',
      decimals: 12,
      assetId: '42',
      location: { parents: 1, interior: { X1: [{ Parachain: 2037 }] } }
    }

    it('should query UniqueApi.balance with the collection id and item id 0', async () => {
      const queryRuntimeApi = vi.fn().mockResolvedValue({ success: true, value: 500n, ok: 300n })

      const api = { queryRuntimeApi } as unknown as PolkadotApi<unknown, unknown, unknown>

      const balance = await chain.getBalanceForeign(api, address, asset)

      expect(queryRuntimeApi).toHaveBeenCalledWith({
        module: 'UniqueApi',
        method: 'balance',
        params: [42, { Substrate: address }, 0]
      })
      expect(balance).toBe(500n)
    })
  })
})
