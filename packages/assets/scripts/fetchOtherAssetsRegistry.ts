/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getParaId } from '../../sdk-core/src'
import { isRelayChain, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { normalizeMultiLocation, type TForeignAsset } from '../src'
import type { TRegistryAssets } from './fetchXcmRegistry'
import { fetchXcmRegistry } from './fetchXcmRegistry'
import { getRelayChainType } from './utils'

export const fetchAssets = async (node: TNodePolkadotKusama): Promise<TRegistryAssets[]> => {
  const data = await fetchXcmRegistry()

  const paraId = getParaId(node)
  const relay = getRelayChainType(node)

  const doesNotUseXcAssets =
    node === 'AssetHubPolkadot' || node === 'AssetHubKusama' || isRelayChain(node)

  const assets = data[doesNotUseXcAssets ? 'assets' : 'xcAssets'][relay].find(
    item => item.paraID === paraId
  )?.data

  if (!assets) {
    throw new Error(`No assets found for ${node}`)
  }

  return doesNotUseXcAssets ? assets.filter(asset => !!asset.xcmInteriorKey) : assets
}

export const capitalizeMultiLocation = (obj: any) => {
  obj.interior = capitalizeKeys(obj.interior)
  return normalizeMultiLocation(obj)
}

export const capitalizeKeys = (obj: any, depth: number = 1): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj // Primitive value, return as is
  }

  if (Array.isArray(obj)) {
    // Process each element in the array
    return obj.map(element => capitalizeKeys(element, depth))
  }

  const newObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      let value = obj[key]
      const isLeafNode = typeof value !== 'object' || value === null

      let capitalizedKey: string
      if (depth <= 2 || !isLeafNode) {
        // Capitalize the key
        capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
      } else {
        // Do not capitalize leaf nodes beyond depth 2
        capitalizedKey = key
      }

      if (key === 'generalKey' && typeof value === 'string') {
        let data = value
        const hexString = data.startsWith('0x') ? data.slice(2) : data
        const byteLength = hexString.length / 2 // Each byte is two hex characters

        // Pad hexString with trailing zeros to make it 32 bytes (64 hex characters)
        const paddedHexString = hexString.padEnd(64, '0') // 64 hex chars = 32 bytes
        data = '0x' + paddedHexString

        value = {
          length: byteLength,
          data: data
        }
      }

      // Recursively process nested objects
      newObj[capitalizedKey] = capitalizeKeys(value, depth + 1)
    }
  }
  return newObj
}

export const fetchOtherAssetsRegistry = async (
  node: TNodePolkadotKusama
): Promise<TForeignAsset[]> => {
  const assets = await fetchAssets(node)
  const data = await fetchXcmRegistry()

  const isBifrost = node === 'BifrostPolkadot' || node === 'BifrostKusama'

  return assets
    .filter(item => item.currencyID !== 'Native')
    .filter(item => {
      if (!isBifrost) return true
      const excludedKeys = ['Native', 'Token', 'Stable', 'VToken', 'VSToken']
      return !excludedKeys.includes(Object.keys(item.asset)[0])
    })
    .map(item => {
      const assetField = item.currencyID ?? item.asset
      const id =
        typeof assetField === 'string' ? assetField : (Object.values(assetField)[0] as string)
      const sanitizedId = id.replace(',', '')

      let multiLocation: any = item.xcmV1MultiLocation
        ? (Object.values(item.xcmV1MultiLocation)[0] as object)
        : undefined

      if (multiLocation) {
        multiLocation = capitalizeMultiLocation(multiLocation)
      }

      const relay = getRelayChainType(node)
      let xcmInteriorKey = item.xcmInteriorKey

      const assetsRegistry = data.xcmRegistry.find(item => item.relayChain === relay)?.data

      if (!multiLocation && xcmInteriorKey && assetsRegistry && assetsRegistry[xcmInteriorKey]) {
        const foundAsset = assetsRegistry[xcmInteriorKey]
        multiLocation = capitalizeMultiLocation(foundAsset.xcmV1MultiLocation.v1)
      }

      return {
        assetId: sanitizedId,
        symbol: item.symbol,
        decimals: item.decimals,
        multiLocation: multiLocation
      }
    })
}
