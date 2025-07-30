// Contains detailed structure of XCM call construction for Amplitude Parachain

import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXcmAsset, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Amplitude<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Amplitude', 'amplitude', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    assertHasId(asset)

    const currencySelection: TXcmAsset = { XCM: Number(asset.assetId) }
    return transferXTokens(input, currencySelection)
  }
}

export default Amplitude
