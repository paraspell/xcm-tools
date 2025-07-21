// Contains detailed structure of XCM call construction for Centrifuge Parachain

import type { TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import ParachainNode from '../ParachainNode'

class Centrifuge<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'polkadot', Version.V4)
  }

  private getCurrencySelection(asset: TAsset) {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Native'

    assertHasId(asset)

    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Centrifuge
