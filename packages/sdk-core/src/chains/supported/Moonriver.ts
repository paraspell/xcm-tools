// Contains detailed structure of XCM call construction for Moonriver Parachain

import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils'
import Parachain from '../Parachain'

class Moonriver<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(options: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Moonbeam'>('Moonbeam').transferLocalNonNativeAsset(options)
  }
}

export default Moonriver
