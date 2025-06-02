import { getNativeAssetSymbol, InvalidCurrencyError } from '@paraspell/assets'

import type { TGetBalanceNativeOptions } from '../../../types/TBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getEthErc20Balance } from './getEthErc20Balance'

export const getBalanceNativeInternal = async <TApi, TRes>({
  address,
  node,
  api,
  currency
}: TGetBalanceNativeOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  const resolvedCurrency = { symbol: currency ? currency.symbol : getNativeAssetSymbol(node) }

  if (node === 'Ethereum') {
    return getEthErc20Balance(resolvedCurrency, address)
  }

  if (node === 'Interlay' || node === 'Kintsugi') {
    return getBalanceForeignInternal({
      address,
      node,
      api,
      currency: resolvedCurrency
    })
  }

  if (
    currency &&
    currency.symbol !== getNativeAssetSymbol(node) &&
    (node === 'Acala' || node === 'Karura')
  ) {
    const symbol = currency.symbol === 'aSEED' ? 'AUSD' : currency.symbol
    if (symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT balance is not supported')
    }
    return api.getBalanceNativeAcala(address, symbol)
  }

  return api.getBalanceNative(address)
}

export const getBalanceNative = async <TApi, TRes>(
  options: TGetBalanceNativeOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceNativeInternal(options)
  } finally {
    await api.disconnect()
  }
}
