// Contains detailed structure of XCM call construction for Robonomics Parachain

import { Version } from '@paraspell/sdk-common'

import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class RobonomicsKusama<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor() {
    super('RobonomicsKusama', 'robonomics', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'RobonomicsPolkadot'>(
      'RobonomicsPolkadot'
    ).transferLocalNonNativeAsset(options)
  }
}

export default RobonomicsKusama
