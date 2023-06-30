// Contains detailed structure of XCM call construction for Centrifuge Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

export class Centrifuge extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'polkadot', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection = currency === 'CFG' ? 'Native' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
