/* eslint-disable @typescript-eslint/no-unused-expressions */
import { describe, it, expect, vi } from 'vitest'
import {
  getBalanceNative,
  getBalanceForeign,
  getTransferInfo,
  getAssetBalance,
  claimAssets
} from './assets'
import { createPapiApiCall } from './utils'
import {
  getBalanceNative as getBalanceNativeImpl,
  getBalanceForeign as getBalanceForeignImpl,
  getTransferInfo as getTransferInfoImpl,
  getAssetBalance as getAssetBalanceImpl,
  claimAssets as claimAssetsImpl
} from '@paraspell/sdk-core'
import type { TPapiApi, TPapiTransaction } from './types'

vi.mock('./utils', () => ({
  createPapiApiCall: vi.fn()
}))

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

  it('should call createPapiApiCall with getTransferInfoImpl for getTransferInfo', () => {
    getTransferInfo

    expect(createPapiApiCall).toHaveBeenCalledWith(getTransferInfoImpl<TPapiApi, TPapiTransaction>)
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
