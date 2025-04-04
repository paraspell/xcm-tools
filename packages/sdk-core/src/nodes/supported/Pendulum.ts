// Contains detailed structure of XCM call construction for Pendulum Parachain

import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { IXTokensTransfer, TXcmAsset, TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Pendulum<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'polkadot', Version.V2)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection: TXcmAsset = asset.symbol === 'PEN'
      ? {
          Native: null}
      : {
          XCM: isForeignAsset(asset)
            ? Number(asset.assetId)
            : (() => { throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`); })()
        }

    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

}

export default Pendulum
