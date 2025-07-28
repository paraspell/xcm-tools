import type { TJunctionType, TLocation } from '../../types'
import { flattenJunctions } from './flattenJunctions'

const findMatchingJunction = (location: TLocation, junctionType: TJunctionType) => {
  if (location.interior === 'Here') {
    return undefined
  }
  const allJunctions = flattenJunctions(location.interior)
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
  location: TLocation,
  junctionType: TJunctionType
): T | undefined => {
  const matchingJunction = findMatchingJunction(location, junctionType)
  return matchingJunction
    ? ((matchingJunction as Record<string, unknown>)[junctionType] as T)
    : undefined
}

export const hasJunction = (
  location: TLocation,
  junctionType: TJunctionType,
  junctionValue?: unknown
): boolean => {
  const matchingJunction = findMatchingJunction(location, junctionType)

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
