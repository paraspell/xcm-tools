// Contains detailed structure of XCM call construction for ComposableFinance Parachain

import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import ParachainNode from '../ParachainNode'

class ComposableFinance<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('ComposableFinance', 'composable', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    assertHasId(asset)

    return transferXTokens(input, BigInt(asset.assetId))
  }
}

export default ComposableFinance
