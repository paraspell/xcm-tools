// Contains detailed structure of XCM call construction for Shiden Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TScenario,
  type TSendInternalOptions
} from '../../types'
import { generateAddressPayload, getFees } from '../../utils'
import ParachainNode, { supportsPolkadotXCM, supportsXTokens } from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import XTokensTransferImpl from '../XTokensTransferImpl'
import { getParaId } from '../../pallets/assets'
import { NoXCMSupportImplementedError } from '../../errors'

class Shiden extends ParachainNode implements IPolkadotXCMTransfer, IXTokensTransfer {
  constructor() {
    super('Shiden', 'shiden', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // Same as Astar, works
    // https://shiden.subscan.io/xcm_message/kusama-97eb47c25c781affa557f36dbd117d49f7e1ab4e
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
    if (supportsXTokens(this) && currencySymbol !== 'SDN') {
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

export default Shiden
