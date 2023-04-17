import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

export class Centrifuge extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'polkadot')
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection = currency === 'CFG' ? 'Native' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
