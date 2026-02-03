// Contains detailed structure of XCM call construction for Quartz Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Quartz<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Quartz', 'quartz', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  isSendingTempDisabled(): boolean {
    return true
  }
}

export default Quartz
