// Contains detailed structure of XCM call construction for Shiden Parachain

import type { TTransferReturn } from '../../types'
import {
  Version,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type XTokensTransferInput
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Shiden<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer, IXTokensTransfer
{
  constructor() {
    super('Shiden', 'shiden', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): TTransferReturn<TRes> {
    // Same as Astar, works
    // https://shiden.subscan.io/xcm_message/kusama-97eb47c25c781affa557f36dbd117d49f7e1ab4e
    return getNode<TApi, TRes, 'Astar'>('Astar').transferPolkadotXCM(input)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>): TTransferReturn<TRes> {
    return getNode<TApi, TRes, 'Astar'>('Astar').transferXTokens(input)
  }

  protected canUseXTokens({
    currencySymbol,
    currencyId
  }: TSendInternalOptions<TApi, TRes>): boolean {
    return currencySymbol !== this.getNativeAssetSymbol() || !!currencyId
  }
}

export default Shiden
