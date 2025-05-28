// Contains detailed structure of XCM call construction for Pendulum Parachain

import type { TAsset } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { IXTokensTransfer, TXcmAsset, TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Pendulum<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TXcmAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) {
      return { Native: null }
    }

    if (isForeignAsset(asset) && asset.assetId !== undefined) {
      return { XCM: Number(asset.assetId) }
    }

    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection = this.getCurrencySelection(asset)

    return XTokensTransferImpl.transferXTokens(
      {
        ...input,
        useMultiAssetTransfer: asset.symbol === 'DOT'
      },
      currencySelection
    )
  }
}

export default Pendulum
