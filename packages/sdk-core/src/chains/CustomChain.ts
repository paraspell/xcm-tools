// Generic Chain implementation used for user-registered customChains.

import type { TRelaychain, Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../types'
import Chain from './Chain'

class CustomChain<TApi, TRes, TSigner, TCustomChain extends string = string>
  extends Chain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(name: TCustomChain, ecosystem: TRelaychain, version: Version) {
    super(name, name, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default CustomChain
