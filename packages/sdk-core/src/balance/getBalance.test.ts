import { type TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { getChainImpl } from '../chains/getChainInstance'
import { validateAddress } from '../utils'
import * as getBalanceModule from './getBalance'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common')

vi.mock('../utils')
vi.mock('../chains/getChainInstance')

const createMockApi = () =>
  ({
    init: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    findAssetInfoOrThrow: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn()
  }) as unknown as PolkadotApi<unknown, unknown, unknown>

const baseCurrency = { symbol: 'UNIT' }
const baseAsset = { assetId: 'UNIT' } as TAssetInfo

const mockChainInstance = (getBalance: ReturnType<typeof vi.fn>) => {
  vi.mocked(getChainImpl).mockReturnValueOnce({
    getBalance
  } as unknown as ReturnType<typeof getChainImpl>)
}

describe('getAssetBalanceInternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['Ethereum', 'Polkadot', 'Astar'] as const)(
    'delegates to the chain instance for %s',
    async chain => {
      const api = createMockApi()
      const chainGetBalance = vi.fn().mockResolvedValueOnce(88n)
      mockChainInstance(chainGetBalance)

      const initSpy = vi.spyOn(api, 'init')

      const result = await getBalanceModule.getAssetBalanceInternal({
        api,
        address: 'account',
        chain,
        asset: baseAsset
      })

      expect(validateAddress).toHaveBeenCalledWith(api, 'account', chain, false)
      expect(initSpy).toHaveBeenCalledWith(chain)
      expect(getChainImpl).toHaveBeenCalledWith(chain, undefined)
      expect(chainGetBalance).toHaveBeenCalledWith(api, 'account', baseAsset)
      expect(result).toBe(88n)
    }
  )
})

describe('getBalanceInternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('looks up asset info before delegating', async () => {
    const api = createMockApi()
    const findAssetInfoOrThrowSpy = vi
      .spyOn(api, 'findAssetInfoOrThrow')
      .mockReturnValueOnce(baseAsset)
    const chainGetBalance = vi.fn().mockResolvedValueOnce(77n)
    mockChainInstance(chainGetBalance)

    const result = await getBalanceModule.getBalanceInternal({
      api,
      address: 'addr',
      chain: 'Astar',
      currency: baseCurrency
    })

    expect(findAssetInfoOrThrowSpy).toHaveBeenCalledWith('Astar', baseCurrency)
    expect(chainGetBalance).toHaveBeenCalledWith(api, 'addr', baseAsset)
    expect(result).toBe(77n)
  })
})

describe('getBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disconnects the api after a successful call', async () => {
    const api = createMockApi()
    vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValueOnce(baseAsset)
    const chainGetBalance = vi.fn().mockResolvedValueOnce(100n)
    mockChainInstance(chainGetBalance)

    const disconnectSpy = vi.spyOn(api, 'disconnect')

    const result = await getBalanceModule.getBalance({
      api,
      address: 'addr',
      chain: 'Astar',
      currency: baseCurrency
    } as never)

    expect(result).toBe(100n)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('still disconnects the api when the call fails', async () => {
    const api = createMockApi()
    vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValueOnce(baseAsset)
    const chainGetBalance = vi.fn().mockRejectedValueOnce(new Error('failure'))
    mockChainInstance(chainGetBalance)

    const disconnectSpy = vi.spyOn(api, 'disconnect')

    await expect(
      getBalanceModule.getBalance({
        api,
        address: 'addr',
        chain: 'Astar',
        currency: baseCurrency
      })
    ).rejects.toThrow('failure')

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})
