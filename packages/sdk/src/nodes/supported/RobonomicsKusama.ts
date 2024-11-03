// Contains detailed structure of XCM call construction for Robonomics Parachain

import type { TTransferReturn } from '../../types'
import { type IPolkadotXCMTransfer, type PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class RobonomicsKusama<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor() {
    super('RobonomicsKusama', 'robonomics', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    )
  }
}

export default RobonomicsKusama
