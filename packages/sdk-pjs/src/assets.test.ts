/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  claimAssets as claimAssetsImpl,
  getBalance as getAssetBalanceImpl,
  getBalance as getBalanceForeignImpl,
  getBalanceNative as getBalanceNativeImpl
} from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { claimAssets, getAssetBalance, getBalanceForeign, getBalanceNative } from './assets'
import type { Extrinsic, TPjsApi } from './types'
import { createPolkadotJsApiCall } from './utils'

vi.mock('./utils')

describe('API Call Wrappers', () => {
  it('should call createPolkadotJsApiCall with getBalanceNativeImpl for getBalanceNative', () => {
    getBalanceNative

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getBalanceNativeImpl<TPjsApi, Extrinsic>)
  })

  it('should call createPolkadotJsApiCall with getBalanceForeignImpl for getBalanceForeign', () => {
    getBalanceForeign

    expect(createPolkadotJsApiCall).toHaveBeenCalledWith(getBalanceForeignImpl<TPjsApi, Extrinsic>)
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
