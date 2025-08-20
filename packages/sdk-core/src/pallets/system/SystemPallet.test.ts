import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { concat, getAddress, keccak256, pad } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { assertHasId } from '../../utils'
import { formatAssetIdToERC20 } from '../assets/balance'
import { SystemPallet } from './SystemPallet'

vi.mock('../../utils', () => ({
  assertHasId: vi.fn()
}))

vi.mock('../assets/balance', () => ({
  formatAssetIdToERC20: vi.fn(() => '0xERC20')
}))

vi.mock('viem', () => ({
  concat: vi.fn((xs: unknown[]) => `concat:${(xs as string[]).join('+')}`),
  getAddress: vi.fn((k: string) => `addr:${k}`),
  keccak256: vi.fn((x: unknown) => `keccak:${String(x)}`),
  pad: vi.fn((v: unknown, opts: { size: number }) => `pad:${String(v)}:${opts.size}`),
  toHex: vi.fn((v: unknown) => `hex:${String(v)}`)
}))

describe('SystemPallet.setBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds set_storage with encoded amount at the calculated slot', async () => {
    const pallet = new SystemPallet()
    const address = '0xAlice'
    const chain = 'Moonbeam' as TSubstrateChain
    const asset = { assetId: '123', amount: 321n } as unknown as WithAmount<TAssetInfo>
    vi.mocked(assertHasId).mockImplementation(() => {})
    const api = {
      getEvmStorage: vi.fn(async (_contract: string, _slot: string) =>
        Promise.resolve('0xSTORAGEKEY')
      )
    } as unknown as IPolkadotApi<unknown, unknown>

    const expectedSlot = `keccak:concat:pad:addr:${address}:32+pad:hex:0:32`
    const expectedAmount = `pad:hex:321:32`

    const spy = vi.spyOn(api, 'getEvmStorage')

    const res = await pallet.setBalance(address, asset, chain, api)

    expect(vi.mocked(assertHasId)).toHaveBeenCalledWith(asset)
    expect(vi.mocked(formatAssetIdToERC20)).toHaveBeenCalledWith('123')
    expect(vi.mocked(getAddress)).toHaveBeenCalledWith(address)
    expect(vi.mocked(pad)).toHaveBeenCalledWith('hex:321', { size: 32 })
    expect(vi.mocked(concat)).toHaveBeenCalled()
    expect(vi.mocked(keccak256)).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith('0xERC20', expectedSlot)

    expect(res.balanceTx.module).toBe('System')
    expect(res.balanceTx.method).toBe('set_storage')
    expect(res.balanceTx.parameters.items).toEqual([['0xSTORAGEKEY', expectedAmount]])
  })
})
