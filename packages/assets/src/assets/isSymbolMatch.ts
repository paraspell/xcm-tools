import { normalizeSymbol } from './normalizeSymbol'

export const isSymbolMatch = (symbolA: string, symbolB: string): boolean =>
  normalizeSymbol(symbolA) === normalizeSymbol(symbolB)
