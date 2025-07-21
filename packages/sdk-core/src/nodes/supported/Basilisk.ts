// Contains detailed structure of XCM call construction for Basilisk Parachain

import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Basilisk<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'kusama', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    assertHasId(asset)

    return transferXTokens(input, Number(asset.assetId))
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Hydration'>('Hydration').transferLocalNativeAsset(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Hydration'>('Hydration').transferLocalNonNativeAsset(options)
  }
}

export default Basilisk
