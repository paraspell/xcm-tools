// Contains detailed structure of XCM call construction for Moonriver Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils'
import Chain from '../Chain'

class Moonriver<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Moonriver', 'moonriver', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    return getChain<TApi, TRes, TSigner, 'Moonbeam'>('Moonbeam').transferLocalNonNativeAsset(
      options
    )
  }
}

export default Moonriver
