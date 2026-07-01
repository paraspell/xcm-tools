// Contains detailed structure of XCM call construction for relaychains

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import SubstrateChain from '../SubstrateChain'

abstract class Relaychain<TApi, TRes, TSigner>
  extends SubstrateChain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default Relaychain
