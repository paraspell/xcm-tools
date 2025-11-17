// Contains detailed structure of XCM call construction for Basilisk Parachain

import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, getChain } from '../../utils'
import Parachain from '../Parachain'

class Basilisk<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'Kusama', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    assertHasId(asset)
    return transferXTokens(input, Number(asset.assetId))
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    return getChain<TApi, TRes, 'Hydration'>('Hydration').transferLocalNativeAsset(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Hydration'>('Hydration').transferLocalNonNativeAsset(options)
  }
}

export default Basilisk
