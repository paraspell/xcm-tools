// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

export class BifrostPolkadot extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostPolkadot', 'bifrost', 'polkadot', Version.V3)
  }

  private getCurrencySelection(currency: string, currencyId: string | undefined) {
    const nativeAssetSymbol = this.getNativeAssetSymbol()

    if (currency === nativeAssetSymbol) {
      return { Native: nativeAssetSymbol }
    }

    const isVToken = currency.startsWith('v')
    const isVSToken = currency.startsWith('vs')

    if (!currencyId) {
      return isVToken ? { VToken: currency.substring(1) } : { Token: currency }
    }

    const id = Number(currencyId)
    if (isVSToken) {
      return { VSToken2: id }
    }

    return isVToken ? { VToken2: id } : { Token2: id }
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input

    if (!currency) {
      throw new Error('Currency symbol is undefined')
    }

    const currencySelection = this.getCurrencySelection(currency, currencyID)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
