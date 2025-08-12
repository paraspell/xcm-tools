// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { Version } from '@paraspell/sdk-common'

import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import Parachain from '../Parachain'

class BifrostKusama<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'Kusama', Version.V5)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferXTokens(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferLocalNonNativeAsset(
      options
    )
  }
}

export default BifrostKusama
