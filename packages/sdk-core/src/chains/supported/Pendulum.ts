// Contains detailed structure of XCM call construction for Pendulum Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type {
  IXTokensTransfer,
  TTransferLocalOptions,
  TXcmAsset,
  TXTokensTransferOptions
} from '../../types'
import { assertHasId } from '../../utils'
import { getLocalTransferAmount } from '../../utils/transfer'
import Chain from '../Chain'

class Pendulum<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IXTokensTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Pendulum', 'pendulum', 'Polkadot', Version.V3)
  }

  getCustomCurrencyId(asset: TAssetInfo): TXcmAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return { Native: null }
    assertHasId(asset)
    return { XCM: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner>) {
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

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, recipient } = options

    const amount = getLocalTransferAmount(options)

    return api.deserializeExtrinsics({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: recipient },
        currency_id: this.getCustomCurrencyId(asset),
        amount
      }
    })
  }
}

export default Pendulum
