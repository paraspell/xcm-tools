import type { TAmount } from '@paraspell/assets'
import {
  extractAssetLocation,
  findAssetInfo,
  InvalidCurrencyError,
  isAssetEqual,
  isOverrideLocationSpecifier,
  isTAsset,
  type TAssetInfo,
  type TAssetWithFee
} from '@paraspell/assets'
import { deepEqual, isTLocation, type TLocation } from '@paraspell/sdk-common'

import { AMOUNT_ALL } from '../../constants'
import type { TSendOptions } from '../../types'
import { abstractDecimals, assertHasLocation, createAsset, getChainVersion } from '../../utils'
import { validateAssetSupport } from './validateAssetSupport'

export const resolveOverriddenAsset = <TApi, TRes, TSigner>(
  options: TSendOptions<TApi, TRes, TSigner>,
  isBridge: boolean,
  assetCheckEnabled: boolean,
  resolvedFeeAsset: TAssetInfo | undefined
): TLocation | TAssetWithFee[] | undefined => {
  const { api, currency, feeAsset, from: origin, to: destination } = options
  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    return currency.location.value
  }

  if (Array.isArray(currency)) {
    if (!feeAsset) {
      throw new InvalidCurrencyError(
        'Overridden multi assets cannot be used without specifying fee asset'
      )
    }

    if ('location' in feeAsset && isOverrideLocationSpecifier(feeAsset.location)) {
      throw new InvalidCurrencyError('Fee asset cannot be an overridden location specifier')
    }

    if (currency.every(asset => isTAsset<TAmount>(asset))) {
      if (!feeAsset) {
        throw new InvalidCurrencyError('Fee asset not provided')
      }

      if (!('location' in feeAsset)) {
        throw new InvalidCurrencyError(
          'Fee asset must be specified by location when using raw overridden multi assets'
        )
      }

      return currency.map(asset => {
        const ml = extractAssetLocation(asset)
        return {
          ...asset,
          fun: { Fungible: BigInt(asset.fun.Fungible) },
          isFeeAsset: deepEqual(ml, feeAsset.location)
        }
      })
    }

    // MultiAsset is an array of TCurrencyCore, search for assets
    const assets = currency.map(currency => {
      if (currency.amount === AMOUNT_ALL) {
        throw new InvalidCurrencyError('Multi assets cannot use amount all. Please specify amount.')
      }

      const asset = findAssetInfo(origin, currency, !isTLocation(destination) ? destination : null)

      if (!asset) {
        throw new InvalidCurrencyError(
          `Origin chain ${origin} does not support currency ${JSON.stringify(currency)}`
        )
      }

      assertHasLocation(asset)

      if (!resolvedFeeAsset) {
        throw new InvalidCurrencyError('Fee asset not found')
      }

      validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

      const version = getChainVersion(origin)

      const abstractedAmount = abstractDecimals(currency.amount, asset.decimals, api)

      return {
        isFeeAsset: isAssetEqual(resolvedFeeAsset, asset),
        ...createAsset(version, abstractedAmount, asset.location)
      }
    })

    if (assets.filter(asset => asset.isFeeAsset).length > 1) {
      throw new InvalidCurrencyError(`Fee asset matches multiple assets in multiassets`)
    }

    if (assets.filter(asset => asset.isFeeAsset).length === 0) {
      throw new InvalidCurrencyError(`Fee asset not found in multiassets`)
    }

    return assets
  }

  return undefined
}
