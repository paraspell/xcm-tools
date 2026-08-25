import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { UnsupportedOperationError } from '../../errors'
import { SystemPallet } from './SystemPallet'

describe('SystemPallet.mint', () => {
  it('throws because the System pallet cannot mint', () => {
    const pallet = new SystemPallet('System')

    expect(() =>
      pallet.mint(
        {} as PolkadotApi<unknown, unknown, unknown>,
        'Alice',
        {} as WithAmount<TAssetInfo>,
        0n
      )
    ).toThrow(UnsupportedOperationError)
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
