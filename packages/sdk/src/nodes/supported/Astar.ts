// Contains detailed structure of XCM call construction for Astar Parachain

import type { TTransferReturn } from '../../types'
import {
  Version,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import XTokensTransferImpl from '../xTokens'

class Astar<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer, IXTokensTransfer
{
  constructor() {
    super('Astar', 'astar', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
    const section =
      input.scenario === 'ParaToPara' ? 'reserve_transfer_assets' : 'reserve_withdraw_assets'
    return Promise.resolve(PolkadotXCMTransferImpl.transferPolkadotXCM(input, section))
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID ? BigInt(currencyID) : undefined)
  }

  protected canUseXTokens({
    currencySymbol,
    currencyId
  }: TSendInternalOptions<TApi, TRes>): boolean {
    return currencySymbol !== this.getNativeAssetSymbol() || !!currencyId
  }
}

export default Astar
