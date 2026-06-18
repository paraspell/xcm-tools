/* eslint-disable @typescript-eslint/no-explicit-any */
import { lowercaseFirstLetter, snakeToCamel } from '@paraspell/sdk-common'
import type { TLocation } from '@paraspell/sdk-common'
import { toHex } from 'polkadot-api/utils'

export const decodeSymbol = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) return new TextDecoder().decode(value)
  return String(value ?? '')
}

const normalizeValue = (value: any, depth: number): any => {
  if (value === undefined || value === null) return null
  if (typeof value === 'bigint')
    return value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : '0x' + value.toString(16).padStart(32, '0')
  if (typeof value !== 'object') return value
  if (typeof value.asHex === 'function') return value.asHex()
  if (value instanceof Uint8Array) return toHex(value)
  if (Array.isArray(value)) return value.map(v => normalizeValue(v, depth))
  if (typeof value.type === 'string') {
    const inner = normalizeValue(value.value, depth + 1)
    if (value.type === 'GeneralKey' && typeof inner === 'string') {
      return {
        GeneralKey: { length: (inner.length - 2) / 2, data: '0x' + inner.slice(2).padEnd(64, '0') }
      }
    }
    const isObjectPayload = value.value !== null && typeof value.value === 'object'
    const key = depth <= 2 || isObjectPayload ? value.type : lowercaseFirstLetter(value.type)
    return { [key]: inner }
  }
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [snakeToCamel(k), normalizeValue(v, depth + 1)])
  )
}

const normalizeInterior = (interior: any) => {
  if (interior.type === 'Here') return { Here: null }
  const junctions = Array.isArray(interior.value) ? interior.value : [interior.value]
  return { [interior.type]: junctions.map((j: any) => normalizeValue(j, 2)) }
}

export const normalizeLocation = (loc: any): TLocation | undefined => {
  if (loc === null || loc === undefined) return undefined
  if (typeof loc.type === 'string' && /^V\d+$/.test(loc.type)) return normalizeLocation(loc.value)
  return { parents: loc.parents, interior: normalizeInterior(loc.interior) } as TLocation
}
