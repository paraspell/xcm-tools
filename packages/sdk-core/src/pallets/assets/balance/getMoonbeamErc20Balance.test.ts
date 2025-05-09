import type { ethers } from 'ethers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatAssetIdToERC20 } from './formatAssetIdToERC20'
import { getMoonbeamErc20Balance } from './getMoonbeamErc20Balance'

vi.mock('./formatAssetIdToERC20', () => ({
  formatAssetIdToERC20: vi.fn((id: string) => (id.startsWith('0x') ? id : `0xmocked${id}`))
}))

const mockBalanceOf = vi.fn()
const mockProviderConstructor = vi.fn()
const mockContractConstructor = vi.fn()

vi.mock('ethers', async () => {
  const actual = await vi.importActual<typeof import('ethers')>('ethers')

  class MockProvider {
    constructor(rpc: string, id: number) {
      mockProviderConstructor(rpc, id)
    }
  }

  class MockContract {
    address: string
    abi: unknown
    provider: unknown
    balanceOf = mockBalanceOf

    constructor(address: string, abi: unknown, provider: unknown) {
      this.address = address
      this.abi = abi
      this.provider = provider
      mockContractConstructor(address, abi, provider)
    }
  }

  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      JsonRpcProvider: MockProvider,
      Contract: MockContract as unknown as ethers.Contract
    }
  }
})

const MOONBEAM_RPC = 'https://rpc.api.moonbeam.network'
const MOONBEAM_ID = 1284
const MOONRIVER_RPC = 'https://rpc.api.moonriver.moonbeam.network'
const MOONRIVER_ID = 1285

describe('getMoonbeamErc20Balance', () => {
  const WALLET = '0xA11CE0000000000000000000000000000000000'
  const RAW = 123456789n

  beforeEach(() => {
    vi.clearAllMocks()
    mockBalanceOf.mockResolvedValue(RAW)
  })

  afterEach(() => vi.clearAllMocks())

  it('Moonbeam: returns bigint balance for direct 0x address', async () => {
    const ASSET = '0xDEADBEEF00000000000000000000000000000000'

    const bal = await getMoonbeamErc20Balance('Moonbeam', ASSET, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(ASSET)
    expect(mockProviderConstructor).toHaveBeenCalledWith(MOONBEAM_RPC, MOONBEAM_ID)
    expect(mockContractConstructor).toHaveBeenCalledWith(
      ASSET,
      ['function balanceOf(address) view returns (uint256)'],
      expect.any(Object)
    )
    expect(mockBalanceOf).toHaveBeenCalledWith(WALLET)
  })

  it('Moonriver: returns bigint balance for direct 0x address', async () => {
    const ASSET = '0xFEEDBEEF00000000000000000000000000000000'

    const bal = await getMoonbeamErc20Balance('Moonriver', ASSET, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(ASSET)
    expect(mockProviderConstructor).toHaveBeenCalledWith(MOONRIVER_RPC, MOONRIVER_ID)
    expect(mockContractConstructor).toHaveBeenCalledWith(
      ASSET,
      ['function balanceOf(address) view returns (uint256)'],
      expect.any(Object)
    )
    expect(mockBalanceOf).toHaveBeenCalledWith(WALLET)
  })

  it('Moonbeam: converts numeric assetId and returns bigint balance', async () => {
    const NUMERIC_ASSET_ID = '1234'
    const EXPECTED_ADDR = `0xmocked${NUMERIC_ASSET_ID}`

    const bal = await getMoonbeamErc20Balance('Moonbeam', NUMERIC_ASSET_ID, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(NUMERIC_ASSET_ID)
    expect(mockContractConstructor).toHaveBeenCalledWith(
      EXPECTED_ADDR,
      expect.any(Array),
      expect.any(Object)
    )
  })

  it('propagates errors thrown by balanceOf', async () => {
    mockBalanceOf.mockRejectedValueOnce(new Error('boom'))
    await expect(getMoonbeamErc20Balance('Moonbeam', '0xAB', WALLET)).rejects.toThrow('boom')
  })
})
