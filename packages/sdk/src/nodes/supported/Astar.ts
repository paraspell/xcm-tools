// Contains detailed structure of XCM call construction for Astar Parachain

import { NoXCMSupportImplementedError } from '../../errors'
import { getParaId } from '../../pallets/assets'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type TScenario,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TSendInternalOptions
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

  transfer(options: TSendInternalOptions): Extrinsic | TSerializedApiCall {
    const {
      api,
      currencySymbol,
      currencyId,
      amount,
      address,
      destination,
      paraIdTo,
      overridedCurrencyMultiLocation,
      serializedApiCallEnabled = false
    } = options
    const scenario: TScenario = destination !== undefined ? 'ParaToPara' : 'ParaToRelay'
    const paraId =
      destination !== undefined && typeof destination !== 'object'
        ? paraIdTo ?? getParaId(destination)
        : undefined

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
          address,
          this.version,
          paraId
        ),
        fees: getFees(scenario),
        origin: this.node,
        scenario,
        paraIdTo: paraId,
        destination,
        overridedCurrencyMultiLocation,
        serializedApiCallEnabled
      })
    } else if (supportsPolkadotXCM(this)) {
      return this.transferPolkadotXCM({
        api,
        header: this.createPolkadotXcmHeader(scenario, destination, paraId),
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'PolkadotXcm',
          address,
          this.version,
          paraId
        ),
        currencySelection: this.createCurrencySpec(
          amount,
          scenario,
          this.version,
          currencyId,
          overridedCurrencyMultiLocation
        ),
        scenario,
        currencySymbol,
        serializedApiCallEnabled
      })
    }
    throw new NoXCMSupportImplementedError(node)
  }
}

export default Astar
