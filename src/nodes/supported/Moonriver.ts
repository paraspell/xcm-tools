// Contains detailed structure of XCM call construction for Moonriver Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Moonriver extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection = currency === 'MOVR' ? 'SelfReserve ' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Moonriver
