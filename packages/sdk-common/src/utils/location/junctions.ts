import type { TJunctionType, TMultiLocation } from '../../types'
import { flattenJunctions } from './flattenJunctions'

const findMatchingJunction = (multiLocation: TMultiLocation, junctionType: TJunctionType) => {
  if (multiLocation.interior === 'Here') {
    return undefined
  }
  const allJunctions = flattenJunctions(multiLocation.interior)
  return allJunctions.find(junction => {
    const keys = Object.keys(junction)
    if (keys.length !== 1) {
      return false
    }
    const key = keys[0] as TJunctionType
    return key === junctionType
  })
}

export const getJunctionValue = <T = unknown>(
  multiLocation: TMultiLocation,
  junctionType: TJunctionType
): T | undefined => {
  const matchingJunction = findMatchingJunction(multiLocation, junctionType)
  return matchingJunction
    ? ((matchingJunction as Record<string, unknown>)[junctionType] as T)
    : undefined
}

export const hasJunction = (
  multiLocation: TMultiLocation,
  junctionType: TJunctionType,
  junctionValue?: unknown
): boolean => {
  const matchingJunction = findMatchingJunction(multiLocation, junctionType)

  if (!matchingJunction) {
    return false
  }

  if (junctionValue === undefined) {
    return true
  }

  const jv = (matchingJunction as Record<string, unknown>)[junctionType]
  try {
    return JSON.stringify(jv) === JSON.stringify(junctionValue)
  } catch {
    return jv === junctionValue
  }
}
