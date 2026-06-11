import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { concat, getAddress, keccak256, pad } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
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
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    const expectedSlot = `keccak:concat:pad:addr:${address}:32+pad:hex:0:32`
    const expectedAmount = `pad:hex:321:32`

    const spy = vi.spyOn(api, 'getEvmStorage')

    const res = await pallet.mint(api, address, asset, 0n, chain)

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

  it('uses wormhole balance slot when asset id starts with 0x', async () => {
    const pallet = new SystemPallet('System')
    const address = '0xAlice'
    const chain: TSubstrateChain = 'Moonbeam'
    const asset = { assetId: '0x1234', amount: 1n } as WithAmount<TAssetInfo>
    const api = {
      getEvmStorage: vi.fn(async () => Promise.resolve('0xSTORAGEKEY'))
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    const spy = vi.spyOn(api, 'getEvmStorage')

    await pallet.mint(api, address, asset, 0n, chain)

    const expectedSlot = `keccak:concat:pad:addr:${address}:32+pad:hex:5:32`
    expect(spy).toHaveBeenCalledWith('0xERC20', expectedSlot)
  })
})

describe('SystemPallet.getBalance', () => {
  const asset = { existentialDeposit: '100' } as TAssetInfo

  const createApi = (account: unknown) =>
    ({
      queryState: vi.fn(async () => Promise.resolve(account))
    }) as unknown as PolkadotApi<unknown, unknown, unknown>

  it('queries the Account storage of the pallet', async () => {
    const pallet = new SystemPallet('System')
    const api = createApi({ data: { free: 1000n, reserved: 0n, frozen: 0n } })

    const spy = vi.spyOn(api, 'queryState')

    await pallet.getBalance(api, 'Alice', asset)

    expect(spy).toHaveBeenCalledWith({
      module: 'System',
      method: 'Account',
      params: ['Alice']
    })
  })

  it('subtracts frozen minus reserved when it exceeds the existential deposit', async () => {
    const pallet = new SystemPallet('System')
    const api = createApi({ data: { free: 1000n, reserved: 50n, frozen: 400n } })

    await expect(pallet.getBalance(api, 'Alice', asset)).resolves.toBe(650n)
  })

  it('subtracts the existential deposit when frozen minus reserved is below it', async () => {
    const pallet = new SystemPallet('System')
    const api = createApi({ data: { free: 1000n, reserved: 50n, frozen: 120n } })

    await expect(pallet.getBalance(api, 'Alice', asset)).resolves.toBe(900n)
  })

  it('treats a missing existential deposit as zero', async () => {
    const pallet = new SystemPallet('System')
    const api = createApi({ data: { free: 1000n, reserved: 0n, frozen: 0n } })

    await expect(pallet.getBalance(api, 'Alice', {} as TAssetInfo)).resolves.toBe(1000n)
  })

  it('returns 0 when the untouchable amount exceeds free', async () => {
    const pallet = new SystemPallet('System')
    const api = createApi({ data: { free: 100n, reserved: 0n, frozen: 500n } })

    await expect(pallet.getBalance(api, 'Alice', asset)).resolves.toBe(0n)
  })

  it('returns 0 when the account is not found', async () => {
    const pallet = new SystemPallet('System')
    const api = createApi(undefined)

    await expect(pallet.getBalance(api, 'Alice', asset)).resolves.toBe(0n)
  })
})
