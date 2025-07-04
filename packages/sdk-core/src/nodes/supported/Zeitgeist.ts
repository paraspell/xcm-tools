// Contains detailed structure of XCM call construction for Zeitgeist Parachain

import { InvalidCurrencyError, isForeignAsset, type TAsset } from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TXcmForeignAsset,
  type TXTokensTransferOptions,
  type TZeitgeistAsset
} from '../../types'
import ParachainNode from '../ParachainNode'

class Zeitgeist<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'Zeitgeist',
    info: string = 'zeitgeist',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V3
  ) {
    super(chain, info, type, version)
  }

  private getCurrencySelection(asset: TAsset): TZeitgeistAsset | TXcmForeignAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Ztg'

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (asset.assetId === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.callTxMethod({
      module: 'AssetManager',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Zeitgeist
