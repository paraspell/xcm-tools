import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Acala from './Acala'

vi.mock('../../pallets/xTokens')
vi.mock('../config')

describe('Acala', () => {
  let acala: Acala<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'ACA', isNative: true, amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    acala = getChain<unknown, unknown, 'Acala'>('Acala')
  })

  it('should initialize with correct values', () => {
    expect(acala.chain).toBe('Acala')
    expect(acala.info).toBe('acala')
    expect(acala.ecosystem).toBe('Polkadot')
    expect(acala.version).toBe(Version.V5)
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
        decimals: 12,
        assetId: '1',
        amount: 100n
      }
    }

    acala.transferXTokens(inputWithCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
    })
  })

  const mockApi = {
    deserializeExtrinsics: vi.fn(),
    calculateTransactionFee: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('should call transferLocalNativeAsset', async () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n },
      address: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await acala.transferLocalNativeAsset(mockOptions)

    expect(spy).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer_native_currency',
      params: {
        dest: { Id: 'address' },
        amount: 100n
      }
    })
  })

  it('should transfer balance minus fee when amount is ALL', async () => {
    vi.spyOn(mockApi, 'calculateTransactionFee').mockResolvedValue(10n)

    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n },
      address: 'address',
      balance: 1000n,
      senderAddress: 'sender',
      isAmountAll: true
    } as TTransferLocalOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await acala.transferLocalNativeAsset(mockOptions)

    expect(spy).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer_native_currency',
      params: {
        dest: { Id: 'address' },
        amount: 990n
      }
    })
  })

  it('should call transferLocalNonNativeAsset', () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
      address: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    acala.transferLocalNonNativeAsset(mockOptions)

    expect(spy).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: 'address' },
        currency_id: { ForeignAsset: 1 },
        amount: 100n
      }
    })
  })

  it('should call transfer with balance when amount is ALL', () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
      address: 'address',
      balance: 500n,
      isAmountAll: true
    } as TTransferLocalOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    acala.transferLocalNonNativeAsset(mockOptions)

    expect(spy).toHaveBeenCalledWith({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: 'address' },
        currency_id: { ForeignAsset: 1 },
        amount: 500n
      }
    })
  })

  it('should throw ScenarioNotSupportedError when calling transferRelayToPara', () => {
    expect(() => acala.transferRelayToPara()).toThrow(ScenarioNotSupportedError)
  })
})
