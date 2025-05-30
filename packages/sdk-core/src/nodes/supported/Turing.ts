// Contains detailed structure of XCM call construction for Turing Parachain

import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Turing<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Turing', 'turing', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return transferXTokens({ ...input, useMultiAssetTransfer: true }, BigInt(asset.assetId))
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
      module: 'Currencies',
      section: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: BigInt(asset.assetId),
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Turing
