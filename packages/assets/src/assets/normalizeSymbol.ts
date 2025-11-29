/**
 * Normalizes an asset symbol by stripping the 'xc' prefix (if present) and converting it to lowercase.
 *
 * @param symbol - The symbol to normalize.
 * @returns The normalized symbol.
 */
export const normalizeSymbol = (symbol?: string): string => {
  if (!symbol) return ''

  let s = symbol.toLowerCase()
  if (s.startsWith('xc')) s = s.substring(2)
  if (s.endsWith('.e')) s = s.slice(0, -2)

  return s
}
