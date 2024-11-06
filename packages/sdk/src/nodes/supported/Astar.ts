// Contains detailed structure of XCM call construction for Astar Parachain

import { InvalidCurrencyError } from '../../errors'
import type { TTransferReturn } from '../../types'
import {
  Version,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type XTokensTransferInput
} from '../../types'
import { isForeignAsset } from '../../utils/assets'
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
    const { asset } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, BigInt(asset.assetId))
  }

  protected canUseXTokens({ asset }: TSendInternalOptions<TApi, TRes>): boolean {
    return asset.symbol !== this.getNativeAssetSymbol() || isForeignAsset(asset)
  }
}

export default Astar
