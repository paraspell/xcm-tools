import { extractAssetLocation, type TAsset } from '@paraspell/assets'
import type { TJunction, TLocation } from '@paraspell/sdk-common'

// Mirrors the runtime `Ord` of `Location` so that encoded `Assets` decode on chain
const JUNCTION_ORDER = [
  'Parachain',
  'AccountId32',
  'AccountIndex64',
  'AccountKey20',
  'PalletInstance',
  'GeneralIndex',
  'GeneralKey',
  'OnlyChild',
  'Plurality',
  'GlobalConsensus'
]

const NETWORK_ORDER = [
  'bygenesis',
  'byfork',
  'polkadot',
  'kusama',
  'westend',
  'rococo',
  'wococo',
  'ethereum',
  'bitcoincore',
  'bitcoincash',
  'polkadotbulletin'
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toBigInt = (value: unknown): bigint | undefined => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value)
  return undefined
}

const compareValues = (a: unknown, b: unknown): number => {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1

  const aNumber = toBigInt(a)
  const bNumber = toBigInt(b)
  if (aNumber !== undefined && bNumber !== undefined) {
    return aNumber < bNumber ? -1 : aNumber > bNumber ? 1 : 0
  }

  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0

  if (isRecord(a) && isRecord(b)) {
    for (const key of Object.keys(a)) {
      const result = compareValues(a[key], b[key])
      if (result !== 0) return result
    }
  }

  return 0
}

const compareNetworks = (a: unknown, b: unknown): number => {
  const variant = (value: unknown) =>
    typeof value === 'string' ? [value, null] : isRecord(value) ? Object.entries(value)[0] : []
  const [aName, aValue] = variant(a)
  const [bName, bValue] = variant(b)
  const order =
    NETWORK_ORDER.indexOf(String(aName).toLowerCase()) -
    NETWORK_ORDER.indexOf(String(bName).toLowerCase())
  return order !== 0 ? order : compareValues(aValue, bValue)
}

const compareJunctions = (a: TJunction, b: TJunction): number => {
  const [aType, aValue] = Object.entries<unknown>(a)[0]
  const [bType, bValue] = Object.entries<unknown>(b)[0]
  const order = JUNCTION_ORDER.indexOf(aType) - JUNCTION_ORDER.indexOf(bType)
  if (order !== 0) return order
  return aType === 'GlobalConsensus'
    ? compareNetworks(aValue, bValue)
    : compareValues(aValue, bValue)
}

const getJunctions = ({ interior }: TLocation): TJunction[] => {
  if (interior === 'Here') return []
  const junctions = Object.values(interior).find(value => value !== null && value !== undefined)
  if (junctions === undefined) return []
  return Array.isArray(junctions) ? junctions : [junctions]
}

export const compareLocationOrder = (a: TLocation, b: TLocation): number => {
  const parents = Number(a.parents) - Number(b.parents)
  if (parents !== 0) return parents

  const aJunctions = getJunctions(a)
  const bJunctions = getJunctions(b)
  if (aJunctions.length !== bJunctions.length) return aJunctions.length - bJunctions.length

  for (const [index, junction] of aJunctions.entries()) {
    const result = compareJunctions(junction, bJunctions[index])
    if (result !== 0) return result
  }

  return 0
}

export const sortAssets = <T extends TAsset>(assets: T[]) =>
  assets.sort((a, b) => compareLocationOrder(extractAssetLocation(a), extractAssetLocation(b)))
