// Contains detailed structure of XCM call construction for Robonomics Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Robonomics extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Robonomics', 'robonomics', 'kusama', Version.V1)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://robonomics.subscan.io/xcm_message/kusama-e9641113dae59920e5cc0e012f1510ea0e2d0455
    // TESTED https://robonomics.subscan.io/xcm_message/kusama-20b03208c99f2ef29d2d4b4cd4bc5659e54311ea
    const method =
      input.scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method)
  }
}

export default Robonomics
