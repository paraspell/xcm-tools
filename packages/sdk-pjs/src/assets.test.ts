import type { TGetBalanceOptionsBase } from '@paraspell/sdk-core'
import { getBalance as getBalanceImpl } from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { getBalance } from './assets'
import PolkadotJsApi from './PolkadotJsApi'

vi.mock('@paraspell/sdk-core', { spy: true })
vi.mock('./PolkadotJsApi')

describe('API Call Wrappers', () => {
  it('should call getBalanceImpl with PolkadotJsApi for getBalance', async () => {
    vi.mocked(getBalanceImpl).mockResolvedValue(10n)

    const options: TGetBalanceOptionsBase = { chain: 'Acala', address: '0x123' }

    await expect(getBalance(options)).resolves.toBe(10n)
    expect(getBalanceImpl).toHaveBeenCalledWith({ ...options, api: expect.any(PolkadotJsApi) })
  })
})
