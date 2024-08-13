import type { TSendOptionsCommon } from '../../types'
import { isTCurrencySpecifier } from './utils'

export const transformSendOptions = (options: TSendOptionsCommon) => {
  const { currency } = options

  if (isTCurrencySpecifier(currency)) {
    if ('symbol' in currency) {
      return {
        ...options,
        currency: currency.symbol,
        isSymbol: true
      }
    } else if ('id' in currency) {
      return {
        ...options,
        currency: currency.id,
        isSymbol: false
      }
    }
  }

  return {
    ...options,
    currency: currency,
    isSymbol: undefined
  }
}
