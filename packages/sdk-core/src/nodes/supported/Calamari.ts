// Contains detailed structure of XCM call construction for Calamari Parachain

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

class Calamari<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Calamari', 'calamari', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    // Currently only option for XCM transfer
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

export default Calamari
