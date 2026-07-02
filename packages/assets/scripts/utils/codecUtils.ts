export { papiLocationToJson as normalizeLocation } from '../../../swap/src/exchanges/AssetHub/utils/papiLocationToJson'

export const decodeSymbol = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) return new TextDecoder().decode(value)
  return String(value ?? '')
}
