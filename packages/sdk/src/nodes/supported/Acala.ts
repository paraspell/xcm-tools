// Contains detailed structure of XCM call construction for Acala Parachain

import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TNodePolkadotKusama,
  Version,
  type XTokensTransferInput
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Acala extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Acala', 'acala', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection: TForeignOrTokenAsset =
      currencyID !== undefined ? { ForeignAsset: currencyID } : { Token: currency }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[1]
  }
}

export default Acala
