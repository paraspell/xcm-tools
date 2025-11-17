// Contains detailed structure of XCM call construction for Pendulum Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { IXTokensTransfer, TXcmAsset, TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Pendulum<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'Polkadot', Version.V3)
  }

  getCustomCurrencyId(asset: TAssetInfo): TXcmAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return { Native: null }
    assertHasId(asset)
    return { XCM: Number(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection = this.getCustomCurrencyId(asset)

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
