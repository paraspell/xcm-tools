// Contains detailed structure of XCM call construction for Crust Parachain

import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TReserveAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Crust extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Crust', 'crustParachain', 'polkadot', Version.V3)
  }

  getCurrencySelection({ currency, currencyID }: XTokensTransferInput): TReserveAsset {
    if (currency === this.getNativeAssetSymbol()) {
      return 'SelfReserve'
    }

    if (currencyID === undefined) {
      throw new InvalidCurrencyError(`Asset ${currency} is not supported by node ${this.node}.`)
    }

    return { OtherReserve: currencyID }
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, this.getCurrencySelection(input))
  }
}

export default Crust
