import { Parents, TCurrencySelectionHeader, Version } from '../../types'

export const getModifiedCurrencySelection = (
  version: Version,
  amount: string,
  currencyId?: string,
  paraIdTo?: number
): TCurrencySelectionHeader => {
  return {
    [version]: {
      id: {
        Concrete: {
          parents: Parents.ONE,
          interior: {
            X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: currencyId }]
          }
        }
      },
      fun: {
        Fungible: amount
      }
    }
  }
}
