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
  Parents,
  type IXTransferTransfer,
  type TRelayToParaInternalOptions,
  type TSendInternalOptions,
  type TDestination
} from '../types'
import { generateAddressPayload, getFees, getAllNodeProviders, createApiInstance } from '../utils'
import {
  constructRelayToParaParameters,
  createCurrencySpec,
  createPolkadotXcmHeader
} from '../pallets/xcmPallet/utils'
import { type TMultiLocation } from '../types/TMultiLocation'

export const supportsXTokens = (obj: any): obj is IXTokensTransfer => {
  return 'transferXTokens' in obj
}

const supportsXTransfer = (obj: any): obj is IXTransferTransfer => {
  return 'transferXTransfer' in obj
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
    } else if (supportsXTransfer(this)) {
      return this.transferXTransfer({
        api,
        currency: currencySymbol,
        currencyID: currencyId,
        amount,
        recipientAddress: address,
        paraId,
        origin: this.node,
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
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
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
    _?: string,
    overridedMultiLocation?: TMultiLocation
  ): any {
    return createCurrencySpec(
      amount,
      version,
      scenario === 'ParaToRelay' ? Parents.ONE : Parents.ZERO,
      overridedMultiLocation
    )
  }

  createPolkadotXcmHeader(scenario: TScenario, destination?: TDestination, paraId?: number): any {
    return createPolkadotXcmHeader(scenario, this.version, destination, paraId)
  }
}

export default ParachainNode
