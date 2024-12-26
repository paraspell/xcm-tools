import { ETHEREUM_JUNCTION } from '../../const'
import { Parents, type TMultiLocation } from '../../types'

export const createEthereumTokenLocation = (currencyId: string): TMultiLocation => ({
  parents: Parents.TWO,
  interior: {
    X2: [ETHEREUM_JUNCTION, { AccountKey20: { key: currencyId } }]
  }
})
