/* eslint-disable @typescript-eslint/no-unused-expressions */
import { describe, it, expect, vi } from 'vitest'
import {
  getBalanceNative,
  getBalanceForeign,
  getTransferInfo,
  getAssetBalance,
  claimAssets
} from './assets'
import { createPolkadotJsApiCall } from './utils'
import {
  getBalanceNative as getBalanceNativeImpl,
  getBalanceForeign as getBalanceForeignImpl,
  getTransferInfo as getTransferInfoImpl,
  getAssetBalance as getAssetBalanceImpl,
  claimAssets as claimAssetsImpl
} from '@paraspell/sdk-core'
import type { Extrinsic, TPjsApi } from './types'

vi.mock('./utils', () => ({
  createPolkadotJsApiCall: vi.fn()
}))

describe('API Call Wrappers', () => {
  it('should call createPolkadotJsApiCall with getBalanceNativeImpl for getBalanceNative', () => {
    getBalanceNative

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getBalanceNativeImpl<TPjsApi, Extrinsic>)
  })

  it('should call createPolkadotJsApiCall with getBalanceForeignImpl for getBalanceForeign', () => {
    getBalanceForeign

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getBalanceForeignImpl<TPjsApi, Extrinsic>)
  })

  it('should call createPolkadotJsApiCall with getTransferInfoImpl for getTransferInfo', () => {
    getTransferInfo

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getTransferInfoImpl<TPjsApi, Extrinsic>)
  })

  it('should call createPolkadotJsApiCall with getAssetBalanceImpl for getAssetBalance', () => {
    getAssetBalance

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getAssetBalanceImpl<TPjsApi, Extrinsic>)
  })

  it('should call createPolkadotJsApiCall with claimAssetsImpl for claimAssets', () => {
    claimAssets

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(claimAssetsImpl<TPjsApi, Extrinsic>)
  })
})
