import type { TJunction, TJunctions } from '../../types'

export const flattenJunctions = (junctions: TJunctions): TJunction[] => {
  if (junctions.Here !== undefined) {
    return []
  }

  const result: TJunction[] = []

  if (junctions.X1) {
    if (Array.isArray(junctions.X1)) {
      result.push(...junctions.X1)
    } else {
      result.push(junctions.X1)
    }
  }
  if (junctions.X2) result.push(...junctions.X2)
  if (junctions.X3) result.push(...junctions.X3)
  if (junctions.X4) result.push(...junctions.X4)
  if (junctions.X5) result.push(...junctions.X5)
  if (junctions.X6) result.push(...junctions.X6)
  if (junctions.X7) result.push(...junctions.X7)
  if (junctions.X8) result.push(...junctions.X8)

  return result
}
