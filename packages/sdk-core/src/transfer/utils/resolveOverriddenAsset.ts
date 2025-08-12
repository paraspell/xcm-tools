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
import type { TParachain } from '@paraspell/sdk-common'
import { deepEqual, isTLocation, replaceBigInt, type TLocation } from '@paraspell/sdk-common'

import type { TSendOptions } from '../../types'
import { getChain } from '../../utils'
import { createAsset } from '../../utils/asset'
import { validateAssetSupport } from './validateAssetSupport'

export const resolveOverriddenAsset = <TApi, TRes>(
  options: TSendOptions<TApi, TRes>,
  isBridge: boolean,
  assetCheckEnabled: boolean,
  resolvedFeeAsset: TAssetInfo | undefined
): TLocation | TAssetWithFee[] | undefined => {
  const { currency, feeAsset, from: origin, to: destination } = options
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
      const asset = findAssetInfo(origin, currency, !isTLocation(destination) ? destination : null)

      if (asset && !asset.location) {
        throw new InvalidCurrencyError(
          `Asset ${JSON.stringify(currency, replaceBigInt)} does not have a location`
        )
      }

      if (!asset) {
        throw new InvalidCurrencyError(
          `Origin chain ${origin} does not support currency ${JSON.stringify(currency)}`
        )
      }

      if (!resolvedFeeAsset) {
        throw new InvalidCurrencyError('Fee asset not found')
      }

      validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

      const originTyped = origin as TParachain
      const originChain = getChain<TApi, TRes, typeof originTyped>(originTyped)
      return {
        isFeeAsset: isAssetEqual(resolvedFeeAsset, asset),
        ...createAsset(originChain.version, BigInt(currency.amount), asset.location as TLocation)
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
