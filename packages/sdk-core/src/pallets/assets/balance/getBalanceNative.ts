import { getNativeAssetSymbol, InvalidCurrencyError } from '@paraspell/assets'

import type { TGetBalanceNativeOptions } from '../../../types/TBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getEthErc20Balance } from './getEthErc20Balance'

export const getBalanceNativeInternal = async <TApi, TRes>({
  address,
  chain,
  api,
  currency
}: TGetBalanceNativeOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(chain)

  const resolvedCurrency = { symbol: currency ? currency.symbol : getNativeAssetSymbol(chain) }

  if (chain === 'Ethereum') {
    return getEthErc20Balance(resolvedCurrency, address)
  }

  if (chain === 'Interlay' || chain === 'Kintsugi') {
    return getBalanceForeignInternal({
      address,
      chain,
      api,
      currency: resolvedCurrency
    })
  }

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
