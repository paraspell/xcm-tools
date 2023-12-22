// Contains detailed structure of XCM call construction for Shiden Parachain

import { type ApiPromise } from '@polkadot/api'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TNode,
  type TScenario
} from '../../types'
import {
  createCurrencySpecification,
  createHeaderPolkadotXCM,
  generateAddressPayload,
  getFees
} from '../../utils'
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
        header: createHeaderPolkadotXCM(scenario, this.version, paraId),
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'PolkadotXcm',
          to,
          this.version,
          paraId
        ),
        currencySelection: createCurrencySpecification(
          amount,
          scenario,
          this.version,
          node,
          currencyId
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
