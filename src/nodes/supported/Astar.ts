// Contains detailed structure of XCM call construction for Astar Parachain

import { type ApiPromise } from '@polkadot/api'
import { NoXCMSupportImplementedError } from '../../errors'
import { getParaId } from '../../pallets/assets'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type TNode,
  type TScenario,
  type IXTokensTransfer,
  type XTokensTransferInput
} from '../../types'
import { generateAddressPayload, getFees } from '../../utils'
import ParachainNode, { supportsPolkadotXCM, supportsXTokens } from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Astar extends ParachainNode implements IPolkadotXCMTransfer, IXTokensTransfer {
  constructor() {
    super('Astar', 'astar', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
    const method =
      input.scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }

  transfer(
    api: ApiPromise,
    currencySymbol: string | undefined,
    currencyId: string | undefined,
    amount: string,
    to: string,
    destination?: TNode,
    paraIdTo?: number,
    serializedApiCallEnabled = false
  ): Extrinsic | TSerializedApiCall {
    const scenario: TScenario = destination !== undefined ? 'ParaToPara' : 'ParaToRelay'
    const paraId = destination !== undefined ? paraIdTo ?? getParaId(destination) : undefined
    const node = this.node
    if (supportsXTokens(this) && currencySymbol !== 'ASTR') {
      return this.transferXTokens({
        api,
        currency: currencySymbol,
        currencyID: currencyId,
        amount,
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'XTokens',
          to,
          this.version,
          paraId
        ),
        fees: getFees(scenario),
        scenario,
        serializedApiCallEnabled
      })
    } else if (supportsPolkadotXCM(this)) {
      return this.transferPolkadotXCM({
        api,
        header: this.createPolkadotXcmHeader(scenario, paraId),
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'PolkadotXcm',
          to,
          this.version,
          paraId
        ),
        currencySelection: this.createCurrencySpec(amount, scenario, this.version, currencyId),
        scenario,
        currencySymbol,
        serializedApiCallEnabled
      })
    }
    throw new NoXCMSupportImplementedError(node)
  }
}

export default Astar
