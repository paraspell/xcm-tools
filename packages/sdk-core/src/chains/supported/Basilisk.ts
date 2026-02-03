// Contains detailed structure of XCM call construction for Basilisk Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Hydration from './Hydration'

class Basilisk<TApi, TRes, TSigner>
  extends Hydration<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Basilisk', 'basilisk', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default Basilisk
