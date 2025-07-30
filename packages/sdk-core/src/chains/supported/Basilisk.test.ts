import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import { getChainProviders } from '../config'
import type Basilisk from './Basilisk'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

vi.mock('../config', () => ({
  getChainProviders: vi.fn()
}))

describe('Basilisk', () => {
  let basilisk: Basilisk<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'BSX', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  const mockProviders = ['wss://non-preferred-rpc', 'wss://preferred-dwellir-rpc']

  beforeEach(() => {
    basilisk = getChain<unknown, unknown, 'Basilisk'>('Basilisk')
    vi.mocked(getChainProviders).mockReturnValue(mockProviders)
  })

  it('should initialize with correct values', () => {
    expect(basilisk.chain).toBe('Basilisk')
    expect(basilisk.info).toBe('basilisk')
    expect(basilisk.type).toBe('kusama')
    expect(basilisk.version).toBe(Version.V4)
  })

  it('should call transferXTokens with currencyID', () => {
    basilisk.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, Number(123))
  })

  describe('transferLocalNativeAsset', () => {
    it('should call api.callTxMethod with correct parameters', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 1000n },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'callTxMethod')

      basilisk.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        parameters: {
          dest: mockInput.address,
          value: BigInt(mockInput.assetInfo.amount)
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call api.callTxMethod with correct parameters', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'callTxMethod')

      basilisk.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: mockInput.address,
          currency_id: 123,
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })
  })
})
