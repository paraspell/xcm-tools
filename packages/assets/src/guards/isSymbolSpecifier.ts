import type { TCurrencySymbolValue, TSymbolSpecifier } from '../types'

export const isSymbolSpecifier = (
  currencySymbolValue: TCurrencySymbolValue
): currencySymbolValue is TSymbolSpecifier => {
  return (
    typeof currencySymbolValue === 'object' &&
    'type' in currencySymbolValue &&
    'value' in currencySymbolValue
  )
}
