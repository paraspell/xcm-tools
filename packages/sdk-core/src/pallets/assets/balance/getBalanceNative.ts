import { getNativeAssetSymbol, InvalidCurrencyError } from '@paraspell/assets'

import type { TGetBalanceNativeOptions } from '../../../types/TBalance'

export const getBalanceNative = async <TApi, TRes>({
  address,
  chain,
  api,
  currency
}: TGetBalanceNativeOptions<TApi, TRes>): Promise<bigint> => {
  if (
    currency &&
    currency.symbol !== getNativeAssetSymbol(chain) &&
    (chain === 'Acala' || chain === 'Karura')
  ) {
    const symbol = currency.symbol === 'aSEED' ? 'AUSD' : currency.symbol
    if (symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT balance is not supported')
    }
    return api.getBalanceNativeAcala(address, symbol)
  }

  return api.getBalanceNative(address)
}
