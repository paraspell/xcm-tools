// Contains detailed structure of XCM call construction for Pendulum Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { replaceBigInt, Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { IXTokensTransfer, TXcmAsset, TXTokensTransferOptions } from '../../types'
import Parachain from '../Parachain'

class Pendulum<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'Polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAssetInfo): TXcmAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) {
      return { Native: null }
    }

    if (isForeignAsset(asset) && asset.assetId !== undefined) {
      return { XCM: Number(asset.assetId) }
    }

    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset, replaceBigInt)} has no assetId`)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection = this.getCurrencySelection(asset)

    return transferXTokens(
      {
        ...input,
        useMultiAssetTransfer: asset.symbol === 'DOT'
      },
      currencySelection
    )
  }
}

export default Pendulum
