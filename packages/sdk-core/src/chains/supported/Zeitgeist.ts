// Contains detailed structure of XCM call construction for Zeitgeist Parachain

import { type TAssetInfo } from '@paraspell/assets'
import type { TChain, TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TXcmForeignAsset,
  type TXTokensTransferOptions,
  type TZeitgeistAsset
} from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Zeitgeist<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor(
    chain: TParachain = 'Zeitgeist',
    info: string = 'zeitgeist',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  private getCurrencySelection(asset: TAssetInfo): TZeitgeistAsset | TXcmForeignAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Ztg'

    assertHasId(asset)

    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  canReceiveFrom(origin: TChain): boolean {
    return origin !== 'Astar'
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'AssetManager',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: asset.amount
      }
    })
  }
}

export default Zeitgeist
