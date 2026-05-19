// Generic Chain implementation used for user-registered customChains.

import type { TRelaychain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../types'
import Chain from './Chain'

class CustomChain<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(name: string, ecosystem: TRelaychain, version: Version) {
    // TODO: This type cast will be refactored later. We need to widen other function to support TCustomChain
    super(name as TSubstrateChain, name, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default CustomChain
