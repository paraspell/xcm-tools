// Contains detailed structure of XCM call construction for Manta Parachain

import { InvalidCurrencyError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import {
  type IXTokensTransfer,
  type TMantaAsset,
  type TXTokensTransferOptions,
  Version
} from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'

class Manta<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Manta', 'manta', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    const currencySelection: TMantaAsset = {
      MantaCurrency: BigInt(asset.assetId)
    }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Manta
