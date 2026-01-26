// Contains detailed structure of XCM call construction for Quartz Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions
} from '../../types'
import Chain from '../Chain'

class Quartz<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Quartz', 'quartz', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }
}

export default Quartz
