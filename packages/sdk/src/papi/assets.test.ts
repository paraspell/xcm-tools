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
import { getBalanceNative as getBalanceNativeImpl } from '../pallets/assets/balance/getBalanceNative'
import { getBalanceForeign as getBalanceForeignImpl } from '../pallets/assets/balance/getBalanceForeign'
import { getTransferInfo as getTransferInfoImpl } from '../pallets/assets/transfer-info/getTransferInfo'
import { getAssetBalance as getAssetBalanceImpl } from '../pallets/assets/balance/getAssetBalance'
import { default as claimAssetsImpl } from '../pallets/assets/asset-claim'
import type { PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from './types'

vi.mock('./utils', () => ({
  createPapiApiCall: vi.fn()
}))

describe('API Call Wrappers', () => {
  it('should call createPapiApiCall with getBalanceNativeImpl for getBalanceNative', () => {
    getBalanceNative

    expect(createPapiApiCall).toHaveBeenCalledWith(
      getBalanceNativeImpl<PolkadotClient, TPapiTransaction>
    )
  })

  it('should call createPapiApiCall with getBalanceForeignImpl for getBalanceForeign', () => {
    getBalanceForeign

    expect(createPapiApiCall).toHaveBeenCalledWith(
      getBalanceForeignImpl<PolkadotClient, TPapiTransaction>
    )
  })

  it('should call createPapiApiCall with getTransferInfoImpl for getTransferInfo', () => {
    getTransferInfo

    expect(createPapiApiCall).toHaveBeenCalledWith(
      getTransferInfoImpl<PolkadotClient, TPapiTransaction>
    )
  })

  it('should call createPapiApiCall with getAssetBalanceImpl for getAssetBalance', () => {
    getAssetBalance

    expect(createPapiApiCall).toHaveBeenCalledWith(
      getAssetBalanceImpl<PolkadotClient, TPapiTransaction>
    )
  })

  it('should call createPapiApiCall with claimAssetsImpl for claimAssets', () => {
    claimAssets

    expect(createPapiApiCall).toHaveBeenCalledWith(
      claimAssetsImpl<PolkadotClient, TPapiTransaction>
    )
  })
})
