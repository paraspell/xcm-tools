// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import { type ApiPromise } from '@polkadot/api'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getParaId } from '../pallets/assets'
import {
  type TNode,
  type TRelayChainType,
  type Extrinsic,
  type TScenario,
  type IXTokensTransfer,
  type IPolkadotXCMTransfer,
  Version,
  type TSerializedApiCall,
  type TTransferRelayToParaOptions,
  Parents
} from '../types'
import {
  generateAddressPayload,
  getFees,
  createHeaderPolkadotXCM,
  getAllNodeProviders,
  createApiInstance
} from '../utils'
import { constructRelayToParaParameters, createCurrencySpec } from '../pallets/xcmPallet/utils'

export const supportsXTokens = (obj: any): obj is IXTokensTransfer => {
  return 'transferXTokens' in obj
}

export const supportsPolkadotXCM = (obj: any): obj is IPolkadotXCMTransfer => {
  return 'transferPolkadotXCM' in obj
}

abstract class ParachainNode {
  private readonly _node: TNode

  // Property _name maps our node names to names which polkadot libs are using
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayKusama.ts
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayPolkadot.ts
  // These names can be found under object key 'info'
  private readonly _name: string

  private readonly _type: TRelayChainType

  private readonly _version: Version

  protected _assetCheckEnabled = true

  constructor(node: TNode, name: string, type: TRelayChainType, version: Version) {
    this._name = name
    this._type = type
    this._node = node
    this._version = version
  }

  get name(): string {
    return this._name
  }

  get type(): TRelayChainType {
    return this._type
  }

  get node(): TNode {
    return this._node
  }

  get version(): Version {
    return this._version
  }

  get assetCheckEnabled(): boolean {
    return this._assetCheckEnabled
  }

  transfer(
    api: ApiPromise,
    currencySymbol: string | undefined,
    currencyId: string | undefined,
    amount: string,
    to: string,
    destination?: TNode,
    serializedApiCallEnabled = false
  ): Extrinsic | TSerializedApiCall {
    const scenario: TScenario = destination !== undefined ? 'ParaToPara' : 'ParaToRelay'
    const paraId = destination !== undefined ? getParaId(destination) : undefined

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
        currencySelection: this.createCurrencySpec(amount, scenario, this.version, currencyId),
        scenario,
        currencySymbol,
        serializedApiCallEnabled
      })
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }

  transferRelayToPara(options: TTransferRelayToParaOptions): TSerializedApiCall {
    return {
      module: 'xcmPallet',
      section: 'reserveTransferAssets',
      parameters: constructRelayToParaParameters(options, Version.V3)
    }
  }

  getProvider(): string {
    return getAllNodeProviders(this.node)[0]
  }

  async createApiInstance(): Promise<ApiPromise> {
    return await createApiInstance(this.getProvider())
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    currencyId?: string
  ): any {
    return createCurrencySpec(
      amount,
      version,
      scenario === 'ParaToRelay' ? Parents.ONE : Parents.ZERO
    )
  }
}

export default ParachainNode
