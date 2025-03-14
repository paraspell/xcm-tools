export const findBestMatches = <T extends { symbol: string; alias?: string }>(
  assets: T[],
  value: string,
  property: 'symbol' | 'alias' = 'symbol'
): T[] => {
  // First, exact match
  let matches = assets.filter(asset => asset[property] === value)
  if (matches.length > 0) {
    return matches
  }

  // Uppercase match
  const upperValue = value.toUpperCase()
  matches = assets.filter(asset => asset[property] === upperValue)
  if (matches.length > 0) {
    return matches
  }

  // Lowercase match
  const lowerValue = value.toLowerCase()
  matches = assets.filter(asset => asset[property] === lowerValue)
  if (matches.length > 0) {
    return matches
  }

  // Case-insensitive match
  matches = assets.filter(asset => asset[property]?.toLowerCase() === lowerValue)
  return matches
}
