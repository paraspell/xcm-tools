import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import { getLocalTransferAmount } from '../../utils/transfer'
import type Acala from './Acala'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../config')
vi.mock('../../utils/transfer')

describe('Acala', () => {
  let chain: Acala<unknown, unknown, unknown>
  const mockInput = {
    assetInfo: { symbol: 'ACA', isNative: true, amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Acala'>('Acala')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Acala')
    expect(chain.info).toBe('acala')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('uses a custom currency id for minting', () => {
    const api = { isChainEvm: () => false } as unknown as PolkadotApi<unknown, unknown, unknown>
    expect(chain.resolveMintConfig(api)).toMatchObject({ useCustomCurrencyId: true })
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  const mockApi = {
    deserializeExtrinsics: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  it('should use Balances keep alive transfer for native asset', async () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n },
      recipient: 'address',
      balance: 1000n,
      keepAlive: true
    } as TTransferLocalOptions<unknown, unknown, unknown>

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await chain.transferLocalNativeAsset(mockOptions)

    expect(spy).toHaveBeenCalledWith({
      module: 'Balances',
      method: 'transfer_keep_alive',
      params: {
        dest: { Id: 'address' },
        value: 100n
      }
    })
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
        currency_id: { ForeignAsset: 1 },
        amount: 100n
      }
    })
  })

  it('should call transfer with balance when amount is ALL', () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
      recipient: 'address',
      balance: 500n,
      isAmountAll: true
    } as TTransferLocalOptions<unknown, unknown, unknown>

    vi.mocked(getLocalTransferAmount).mockReturnValue(500n)

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

  it('should throw ScenarioNotSupportedError for LcDOT local transfer', () => {
    const mockOptions = {
      api: mockApi,
      assetInfo: { symbol: 'LcDOT', amount: 100n, assetId: '1' },
      recipient: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown, unknown>

    expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(ScenarioNotSupportedError)
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })
})
