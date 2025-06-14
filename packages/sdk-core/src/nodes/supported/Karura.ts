// Contains detailed structure of XCM call construction for Karura Parachain

import { Version } from '@paraspell/sdk-common'

import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Karura<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Karura', 'karura', 'kusama', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Acala'>('Acala').transferXTokens(input)
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Acala'>('Acala').transferLocalNativeAsset(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Acala'>('Acala').transferLocalNonNativeAsset(options)
  }
}

export default Karura
