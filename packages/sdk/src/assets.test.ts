/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  claimAssets as claimAssetsImpl,
  getBalance as getAssetBalanceImpl,
  getBalance as getBalanceForeignImpl,
  getBalanceNative as getBalanceNativeImpl
} from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { claimAssets, getAssetBalance, getBalanceForeign, getBalanceNative } from './assets'
import type { TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

vi.mock('./utils')

describe('API Call Wrappers', () => {
  it('should call createPapiApiCall with getBalanceNativeImpl for getBalanceNative', () => {
    getBalanceNative

    expect(createPapiApiCall).toHaveBeenCalledWith(getBalanceNativeImpl<TPapiApi, TPapiTransaction>)
  })

  it('should call createPapiApiCall with getBalanceForeignImpl for getBalanceForeign', () => {
    getBalanceForeign

    expect(createPapiApiCall).toHaveBeenCalledWith(
      getBalanceForeignImpl<TPapiApi, TPapiTransaction>
    )
  })

  it('should call createPapiApiCall with getAssetBalanceImpl for getAssetBalance', () => {
    getAssetBalance

    expect(createPapiApiCall).toHaveBeenCalledWith(getAssetBalanceImpl<TPapiApi, TPapiTransaction>)
  })

  it('should call createPapiApiCall with claimAssetsImpl for claimAssets', () => {
    claimAssets

    expect(createPapiApiCall).toHaveBeenCalledWith(claimAssetsImpl<TPapiApi, TPapiTransaction>)
  })
})
