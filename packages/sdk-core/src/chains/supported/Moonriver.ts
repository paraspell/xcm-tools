// Contains detailed structure of XCM call construction for Moonriver Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { getSubstrateChainImpl } from '../getChainInstance'
import SubstrateChain from '../SubstrateChain'

class Moonriver<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Moonriver', 'moonriver', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(
      'Moonbeam'
    ).transferLocalNonNativeAsset(options)
  }
}

export default Moonriver
