import { claimAssets as claimAssetsImpl, getBalance as getBalanceImpl } from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { claimAssets, getBalance } from './assets'
import type { Extrinsic, TPjsApi } from './types'
import { createPolkadotJsApiCall } from './utils'

vi.mock('./utils')

describe('API Call Wrappers', () => {
  it('should call createPolkadotJsApiCall with getBalanceImpl for getBalance', () => {
    getBalance
    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getBalanceImpl<TPjsApi, Extrinsic>)
  })

  it('should call createPolkadotJsApiCall with claimAssetsImpl for claimAssets', () => {
    claimAssets
    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(claimAssetsImpl<TPjsApi, Extrinsic>)
  })
})
