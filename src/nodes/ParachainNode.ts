//Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import { ApiPromise } from '@polkadot/api'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getParaId } from '../pallets/assets'
import {
  TNode,
  TRelayChainType,
  Extrinsic,
  TScenario,
  IXTokensTransfer,
  IPolkadotXCMTransfer
} from '../types'
import {
  handleAddress,
  getFees,
  createHeaderPolkadotXCM,
  createCurrencySpecification
} from '../utils'

const supportsXTokens = (obj: any): obj is IXTokensTransfer => {
  return 'transferXTokens' in obj
}

const supportsPolkadotXCM = (obj: any): obj is IPolkadotXCMTransfer => {
  return 'transferPolkadotXCM' in obj
}

abstract class ParachainNode {
  private _node: TNode

  // Property _name maps our node names to names which polkadot libs are using
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayKusama.ts
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayPolkadot.ts
  // These names can be found under object key 'info'
  private _name: string

  private _type: TRelayChainType

  constructor(node: TNode, name: string, type: TRelayChainType) {
    this._name = name
    this._type = type
    this._node = node
  }

  get name() {
    return this._name
  }

  get type() {
    return this._type
  }

  get node() {
    return this._node
  }

  transfer(
    api: ApiPromise,
    currencySymbol: string,
    currencyId: number | undefined,
    amount: any,
    to: string,
    destination?: TNode
  ): Extrinsic {
    const scenario: TScenario = destination ? 'ParaToPara' : 'ParaToRelay'
    const paraId = destination ? getParaId(destination) : undefined

    if (supportsXTokens(this)) {
      return this.transferXTokens({
        api,
        currency: currencySymbol,
        currencyID: currencyId,
        amount,
        addressSelection: handleAddress(scenario, 'xTokens', api, to, paraId, this._node),
        fees: getFees(scenario)
      })
    } else if (supportsPolkadotXCM(this)) {
      return this.transferPolkadotXCM({
        api,
        header: createHeaderPolkadotXCM(scenario, paraId, this._node),
        addressSelection: handleAddress(scenario, 'polkadotXCM', api, to, paraId, this._node),
        currencySelection: createCurrencySpecification(amount, scenario, this._node, currencyId),
        scenario
      })
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }
}

export default ParachainNode
