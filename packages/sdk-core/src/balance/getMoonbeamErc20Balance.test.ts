import { createPublicClient } from 'viem'
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatAssetIdToERC20 } from '../utils/asset'
import { getMoonbeamErc20Balance } from './getMoonbeamErc20Balance'

vi.mock('../utils/asset', () => ({
  formatAssetIdToERC20: vi.fn((id: string) => (id.startsWith('0x') ? id : `0xmocked${id}`))
}))

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: vi.fn()
  }
})

vi.mock('viem/chains', () => ({
  moonbeam: { id: 1284, name: 'Moonbeam' },
  moonriver: { id: 1285, name: 'Moonriver' }
}))

describe('getMoonbeamErc20Balance', () => {
  const WALLET = '0xA11CE0000000000000000000000000000000000'
  const RAW = 123456789n

  let mockReadContract: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    mockReadContract = vi.fn().mockResolvedValue(RAW)
    vi.mocked(createPublicClient).mockReturnValue({
      readContract: mockReadContract
    } as unknown as ReturnType<typeof createPublicClient>)
  })

  afterEach(() => vi.clearAllMocks())

  it('Moonbeam: returns bigint balance for direct 0x address', async () => {
    const ASSET = '0xDEADBEEF00000000000000000000000000000000'

    const bal = await getMoonbeamErc20Balance('Moonbeam', ASSET, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).not.toHaveBeenCalled()
    expect(createPublicClient).toHaveBeenCalled()
    expect(mockReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ASSET,
        functionName: 'balanceOf',
        args: [WALLET]
      })
    )
  })

  it('Moonriver: returns bigint balance for direct 0x address', async () => {
    const ASSET = '0xFEEDBEEF00000000000000000000000000000000'

    const bal = await getMoonbeamErc20Balance('Moonriver', ASSET, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).not.toHaveBeenCalled()
    expect(mockReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ASSET,
        functionName: 'balanceOf',
        args: [WALLET]
      })
    )
  })

  it('Moonbeam: converts numeric assetId and returns bigint balance', async () => {
    const NUMERIC_ASSET_ID = '1234'
    const EXPECTED_ADDR = `0xmocked${NUMERIC_ASSET_ID}`

    const bal = await getMoonbeamErc20Balance('Moonbeam', NUMERIC_ASSET_ID, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(NUMERIC_ASSET_ID)
    expect(mockReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: EXPECTED_ADDR,
        functionName: 'balanceOf',
        args: [WALLET]
      })
    )
  })

  it('Moonriver: converts numeric assetId and returns bigint balance', async () => {
    const NUMERIC_ASSET_ID = '5678'
    const EXPECTED_ADDR = `0xmocked${NUMERIC_ASSET_ID}`

    const bal = await getMoonbeamErc20Balance('Moonriver', NUMERIC_ASSET_ID, WALLET)

    expect(bal).toBe(RAW)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(NUMERIC_ASSET_ID)
    expect(mockReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: EXPECTED_ADDR,
        functionName: 'balanceOf',
        args: [WALLET]
      })
    )
  })

  it('propagates errors thrown by readContract', async () => {
    mockReadContract.mockRejectedValueOnce(new Error('boom'))
    await expect(getMoonbeamErc20Balance('Moonbeam', '0xAB', WALLET)).rejects.toThrow('boom')
  })

  it('creates correct client for Moonbeam', async () => {
    await getMoonbeamErc20Balance('Moonbeam', '0xABCD', WALLET)

    expect(createPublicClient).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: expect.objectContaining({ id: 1284 }),
        transport: expect.anything()
      })
    )
  })

  it('creates correct client for Moonriver', async () => {
    await getMoonbeamErc20Balance('Moonriver', '0xDCBA', WALLET)

    expect(createPublicClient).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: expect.objectContaining({ id: 1285 }),
        transport: expect.anything()
      })
    )
  })
})
