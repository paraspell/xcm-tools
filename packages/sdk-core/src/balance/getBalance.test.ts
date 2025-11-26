import { findAssetInfoOrThrow, type TAssetInfo } from '@paraspell/assets'
import { isRelayChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { getPalletInstance } from '../pallets'
import type { BaseAssetsPallet, TGetAssetBalanceOptions, TGetBalanceOptions } from '../types'
import { getChain, validateAddress } from '../utils'
import * as getBalanceModule from './getBalance'
import { getEthErc20Balance } from './getEthErc20Balance'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common')

vi.mock('../pallets')
vi.mock('../utils')
vi.mock('./getEthErc20Balance')

const createMockApi = () =>
  ({
    init: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined)
  }) as unknown as IPolkadotApi<unknown, unknown>

const baseCurrency = { symbol: 'UNIT' }
const baseAsset = { assetId: 'UNIT' } as TAssetInfo

describe('getAssetBalanceInternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ERC20 balance when chain is Ethereum', async () => {
    const api = createMockApi()
    const asset = { assetId: 'erc20' } as TAssetInfo
    vi.mocked(getEthErc20Balance).mockResolvedValueOnce(123n)

    const initSpy = vi.spyOn(api, 'init')

    const result = await getBalanceModule.getAssetBalanceInternal({
      api,
      address: '0x123',
      chain: 'Ethereum',
      asset
    } as TGetAssetBalanceOptions<unknown, unknown>)

    expect(validateAddress).toHaveBeenCalledWith(api, '0x123', 'Ethereum', false)
    expect(initSpy).toHaveBeenCalledWith('Ethereum')
    expect(getEthErc20Balance).toHaveBeenCalledWith(asset, '0x123')
    expect(isRelayChain).not.toHaveBeenCalled()
    expect(getPalletInstance).not.toHaveBeenCalled()
    expect(getChain).not.toHaveBeenCalled()
    expect(result).toBe(123n)
  })

  it('reads balance from System pallet on relay chains', async () => {
    const api = createMockApi()
    const palletGetBalance = vi.fn().mockResolvedValueOnce(55n)
    vi.mocked(isRelayChain).mockReturnValueOnce(true)
    vi.mocked(getPalletInstance).mockReturnValueOnce({
      getBalance: palletGetBalance
    } as unknown as BaseAssetsPallet)

    const initSpy = vi.spyOn(api, 'init')

    const result = await getBalanceModule.getAssetBalanceInternal({
      api,
      address: 'relay-account',
      chain: 'Polkadot',
      asset: baseAsset
    } as TGetAssetBalanceOptions<unknown, unknown>)

    expect(validateAddress).toHaveBeenCalledWith(api, 'relay-account', 'Polkadot', false)
    expect(initSpy).toHaveBeenCalledWith('Polkadot')
    expect(isRelayChain).toHaveBeenCalledWith('Polkadot')
    expect(getPalletInstance).toHaveBeenCalledWith('System')
    expect(palletGetBalance).toHaveBeenCalledWith(api, 'relay-account', baseAsset)
    expect(getChain).not.toHaveBeenCalled()
    expect(result).toBe(55n)
  })

  it('delegates to chain instance for parachains', async () => {
    const api = createMockApi()
    const chainGetBalance = vi.fn().mockResolvedValueOnce(88n)
    vi.mocked(isRelayChain).mockReturnValueOnce(false)
    vi.mocked(getChain).mockReturnValueOnce({
      getBalance: chainGetBalance
    } as unknown as ReturnType<typeof getChain>)

    const initSpy = vi.spyOn(api, 'init')

    const result = await getBalanceModule.getAssetBalanceInternal({
      api,
      address: 'parachain-account',
      chain: 'Astar',
      asset: baseAsset
    } as never)

    expect(validateAddress).toHaveBeenCalledWith(api, 'parachain-account', 'Astar', false)
    expect(initSpy).toHaveBeenCalledWith('Astar')
    expect(isRelayChain).toHaveBeenCalledWith('Astar')
    expect(getChain).toHaveBeenCalledWith('Astar')
    expect(chainGetBalance).toHaveBeenCalledWith(api, 'parachain-account', baseAsset)
    expect(result).toBe(88n)
  })
})

describe('getBalanceInternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('looks up asset info before delegating', async () => {
    const api = createMockApi()
    const chainGetBalance = vi.fn().mockResolvedValueOnce(77n)
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(baseAsset)
    vi.mocked(isRelayChain).mockReturnValueOnce(false)
    vi.mocked(getChain).mockReturnValueOnce({
      getBalance: chainGetBalance
    } as unknown as ReturnType<typeof getChain>)

    const result = await getBalanceModule.getBalanceInternal({
      api,
      address: 'addr',
      chain: 'Astar',
      currency: baseCurrency
    } as TGetBalanceOptions<unknown, unknown>)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Astar', baseCurrency, null)
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
    const chainGetBalance = vi.fn().mockResolvedValueOnce(100n)
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(baseAsset)
    vi.mocked(isRelayChain).mockReturnValueOnce(false)
    vi.mocked(getChain).mockReturnValueOnce({
      getBalance: chainGetBalance
    } as unknown as ReturnType<typeof getChain>)

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
    const chainGetBalance = vi.fn().mockRejectedValueOnce(new Error('failure'))
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(baseAsset)
    vi.mocked(isRelayChain).mockReturnValueOnce(false)
    vi.mocked(getChain).mockReturnValueOnce({
      getBalance: chainGetBalance
    } as unknown as ReturnType<typeof getChain>)

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
