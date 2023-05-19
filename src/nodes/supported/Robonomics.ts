//Contains detailed structure of XCM call construction for Robonomics Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'

class Robonomics extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Robonomics', 'robonomics', 'kusama')
  }

  transferPolkadotXCM({
    api,
    header,
    addressSelection,
    currencySelection,
    scenario
  }: PolkadotXCMTransferInput) {
    // TESTED https://robonomics.subscan.io/xcm_message/kusama-e9641113dae59920e5cc0e012f1510ea0e2d0455
    // TESTED https://robonomics.subscan.io/xcm_message/kusama-20b03208c99f2ef29d2d4b4cd4bc5659e54311ea
    const method = scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0)
  }
}

export default Robonomics
