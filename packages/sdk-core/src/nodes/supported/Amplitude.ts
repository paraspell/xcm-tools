// Contains detailed structure of XCM call construction for Amplitude Parachain

import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import XTokensTransferImpl from '../../pallets/xTokens'
import {
  type IXTokensTransfer,
  type TXcmAsset,
  type TXTokensTransferOptions,
  Version
} from '../../types'
import ParachainNode from '../ParachainNode'

class Amplitude<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Amplitude', 'amplitude', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    const currencySelection: TXcmAsset = { XCM: Number(asset.assetId) }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Amplitude
