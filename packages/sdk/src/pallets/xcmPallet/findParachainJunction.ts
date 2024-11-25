import type { TJunctionParachain, TMultiLocation } from '../../types'

export const findParachainJunction = (multilocation: TMultiLocation): number | null => {
  const { interior } = multilocation
  if (interior === 'Here') {
    return null
  }
  for (const key in interior) {
    const junctions = (interior as Record<string, unknown>)[key]
    if (Array.isArray(junctions)) {
      for (const junction of junctions) {
        if ('Parachain' in junction) {
          return Number((junction as TJunctionParachain).Parachain)
        }
      }
    } else if (typeof junctions === 'object' && junctions !== null && 'Parachain' in junctions) {
      return Number(junctions.Parachain)
    }
  }
  return null
}
