// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { Version } from '@paraspell/sdk-common'

import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class BifrostKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V5)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferXTokens(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferLocalNonNativeAsset(
      options
    )
  }
}

export default BifrostKusama
