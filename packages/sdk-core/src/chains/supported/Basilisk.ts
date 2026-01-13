// Contains detailed structure of XCM call construction for Basilisk Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Hydration from './Hydration'

class Basilisk<TApi, TRes> extends Hydration<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default Basilisk
