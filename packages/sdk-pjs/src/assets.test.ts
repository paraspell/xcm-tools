import { claimAssets as claimAssetsImpl, getBalance as getBalanceImpl } from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { claimAssets, getBalance } from './assets'
import type { Extrinsic, TPjsApi, TPjsSigner } from './types'
import { createPolkadotJsApiCall } from './utils'

vi.mock('./utils', () => ({
  createPolkadotJsApiCall: vi.fn(() => vi.fn())
}))

describe('API Call Wrappers', () => {
  it('should call createPolkadotJsApiCall with getBalanceImpl for getBalance', async () => {
    await getBalance({ chain: 'Acala', address: '0x123' })
    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(
      getBalanceImpl<TPjsApi, Extrinsic, TPjsSigner>
    )
  })

  it('should call createPolkadotJsApiCall with claimAssetsImpl for claimAssets', async () => {
    await claimAssets({
      chain: 'Acala',
      address: '0x123',
      currency: { symbol: 'DOT', amount: 100n }
    })
    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(
      claimAssetsImpl<TPjsApi, Extrinsic, TPjsSigner>
    )
  })
})
