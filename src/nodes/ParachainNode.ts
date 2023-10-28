// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import { ApiPromise } from '@polkadot/api'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getParaId } from '../pallets/assets'
import {
  TNode,
  TRelayChainType,
  Extrinsic,
  TScenario,
  IXTokensTransfer,
  IPolkadotXCMTransfer,
  Version,
  TSerializedApiCall
} from '../types'
import {
  generateAddressPayload,
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

  private _version: Version

  constructor(node: TNode, name: string, type: TRelayChainType, version: Version) {
    this._name = name
    this._type = type
    this._node = node
    this._version = version
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

  get version() {
    return this._version
  }

  transfer(
    api: ApiPromise,
    currencySymbol: string | undefined,
    currencyId: string | undefined,
    amount: any,
    to: string,
    destination?: TNode,
    serializedApiCallEnabled = false
  ): Extrinsic | TSerializedApiCall {
    const scenario: TScenario = destination ? 'ParaToPara' : 'ParaToRelay'
    const paraId = destination ? getParaId(destination) : undefined

    if (supportsXTokens(this)) {
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
          this._node,
          currencyId
        ),
        scenario,
        currencySymbol,
        serializedApiCallEnabled
      })
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }
}

export default ParachainNode
