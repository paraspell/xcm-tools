import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Acala from './Acala'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../config')

describe('Acala', () => {
  let chain: Acala<unknown, unknown>
  const mockInput = {
    assetInfo: { symbol: 'ACA', isNative: true, amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Acala'>('Acala')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Acala')
    expect(chain.info).toBe('acala')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  const mockApi = {
    deserializeExtrinsics: vi.fn(),
    getPaymentInfo: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('should call transferLocalNativeAsset', async () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n },
      address: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await chain.transferLocalNativeAsset(mockOptions)

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
    vi.spyOn(mockApi, 'getPaymentInfo').mockResolvedValue({
      partialFee: 10n,
      weight: { refTime: 0n, proofSize: 0n }
    })

    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n },
      address: 'address',
      balance: 1000n,
      senderAddress: 'sender',
      isAmountAll: true
    } as TTransferLocalOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await chain.transferLocalNativeAsset(mockOptions)

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

    chain.transferLocalNonNativeAsset(mockOptions)

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

    chain.transferLocalNonNativeAsset(mockOptions)

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

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })
})
