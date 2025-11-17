// Contains detailed structure of XCM call construction for Shiden Parachain

import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError } from '../..'
import type { TSerializedExtrinsics, TTransferLocalOptions } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type TPolkadotXCMTransferOptions,
  type TSendInternalOptions,
  type TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import Parachain from '../Parachain'

class Shiden<TApi, TRes>
  extends Parachain<TApi, TRes>
  implements IPolkadotXCMTransfer, IXTokensTransfer
{
  constructor() {
    super('Shiden', 'shiden', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    // Same as Astar, works
    // https://shiden.subscan.io/xcm_message/kusama-97eb47c25c781affa557f36dbd117d49f7e1ab4e
    return getChain<TApi, TRes, 'Astar'>('Astar').transferPolkadotXCM(input)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Astar'>('Astar').transferXTokens(input)
  }

  canUseXTokens({ assetInfo }: TSendInternalOptions<TApi, TRes>): boolean {
    return assetInfo.symbol !== this.getNativeAssetSymbol()
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Astar'>('Astar').transferLocalNonNativeAsset(options)
  }
}

export default Shiden
