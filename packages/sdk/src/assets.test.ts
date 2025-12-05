import { claimAssets as claimAssetsImpl, getBalance as getBalanceImpl } from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { claimAssets, getBalance } from './assets'
import type { TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

vi.mock('./utils')

describe('API Call Wrappers', () => {
  it('should call createPapiApiCall with getBalanceImpl for getBalance', () => {
    getBalance
    expect(createPapiApiCall).toHaveBeenCalledWith(getBalanceImpl<TPapiApi, TPapiTransaction>)
  })

  it('should call createPapiApiCall with claimAssetsImpl for claimAssets', () => {
    claimAssets
    expect(createPapiApiCall).toHaveBeenCalledWith(claimAssetsImpl<TPapiApi, TPapiTransaction>)
  })
})
