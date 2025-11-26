import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { concat, getAddress, keccak256, pad } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { assertHasId, formatAssetIdToERC20 } from '../../utils'
import { SystemPallet } from './SystemPallet'

vi.mock('../../utils')

vi.mock('viem', () => ({
  concat: vi.fn((xs: unknown[]) => `concat:${(xs as string[]).join('+')}`),
  getAddress: vi.fn((k: string) => `addr:${k}`),
  parseUnits: vi.fn(),
  formatUnits: vi.fn(),
  keccak256: vi.fn((x: unknown) => `keccak:${String(x)}`),
  pad: vi.fn((v: unknown, opts: { size: number }) => `pad:${String(v)}:${opts.size}`),
  toHex: vi.fn((v: unknown) => `hex:${String(v)}`)
}))

describe('SystemPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(formatAssetIdToERC20).mockImplementation(() => `0xERC20`)
  })

  it('builds set_storage with encoded amount at the calculated slot', async () => {
    const pallet = new SystemPallet('System')
    const address = '0xAlice'
    const chain: TSubstrateChain = 'Moonbeam'
    const asset = { assetId: '123', amount: 321n } as WithAmount<TAssetInfo>
    const api = {
      getEvmStorage: vi.fn(async () => Promise.resolve('0xSTORAGEKEY'))
    } as unknown as IPolkadotApi<unknown, unknown>

    const expectedSlot = `keccak:concat:pad:addr:${address}:32+pad:hex:0:32`
    const expectedAmount = `pad:hex:321:32`

    const spy = vi.spyOn(api, 'getEvmStorage')

    const res = await pallet.mint(address, asset, 0n, chain, api)

    expect(assertHasId).toHaveBeenCalledWith(asset)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith('123')
    expect(getAddress).toHaveBeenCalledWith(address)
    expect(pad).toHaveBeenCalledWith('hex:321', { size: 32 })
    expect(concat).toHaveBeenCalled()
    expect(keccak256).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith('0xERC20', expectedSlot)

    expect(res.balanceTx.module).toBe('System')
    expect(res.balanceTx.method).toBe('set_storage')
    expect(res.balanceTx.params.items).toEqual([['0xSTORAGEKEY', expectedAmount]])
  })
})
