/**
 * Normalizes an asset symbol by stripping the 'xc' prefix (if present) and converting it to lowercase.
 *
 * @param symbol - The symbol to normalize.
 * @returns The normalized symbol.
 */
export const normalizeSymbol = (symbol: string | undefined): string => {
  if (!symbol) return ''
  const lowerSymbol = symbol.toLowerCase()
  return lowerSymbol.startsWith('xc') ? lowerSymbol.substring(2) : lowerSymbol
}
