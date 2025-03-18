import type { TJunctionType, TMultiLocation } from '../../types'
import { flattenJunctions } from './flattenJunctions'

export const hasJunction = (
  multiLocation: TMultiLocation,
  junctionType: TJunctionType,
  junctionValue?: unknown
): boolean => {
  if (multiLocation.interior === 'Here') {
    return false
  }
  const allJunctions = flattenJunctions(multiLocation.interior)
  return allJunctions.some(junction => {
    const keys = Object.keys(junction)
    if (keys.length !== 1) {
      return false
    }
    const key = keys[0] as TJunctionType
    if (key !== junctionType) {
      return false
    }
    if (junctionValue === undefined) {
      return true
    }
    const jv = (junction as Record<string, unknown>)[key]
    try {
      return JSON.stringify(jv) === JSON.stringify(junctionValue)
    } catch {
      return jv === junctionValue
    }
  })
}
