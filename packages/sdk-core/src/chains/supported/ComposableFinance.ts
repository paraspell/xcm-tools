// Contains detailed structure of XCM call construction for ComposableFinance Parachain

import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TSendInternalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class ComposableFinance<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('ComposableFinance', 'composable', 'Polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    assertHasId(asset)

    return transferXTokens(input, BigInt(asset.assetId))
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }
}

export default ComposableFinance
