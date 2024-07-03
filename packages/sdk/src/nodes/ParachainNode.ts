/* eslint-disable @typescript-eslint/no-explicit-any */
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
  type TDestination,
  TCurrencySelectionHeaderArr
} from '../types'
import { generateAddressPayload, getFees, getAllNodeProviders, createApiInstance } from '../utils'
import {
  constructRelayToParaParameters,
  createCurrencySpec,
  createPolkadotXcmHeader
} from '../pallets/xcmPallet/utils'
import { TMultiLocationHeader, type TMultiLocation } from '../types/TMultiLocation'
import { type TMultiAsset } from '../types/TMultiAsset'

const supportsXTokens = (obj: any): obj is IXTokensTransfer => {
  return 'transferXTokens' in obj
}

const supportsXTransfer = (obj: any): obj is IXTransferTransfer => {
  return 'transferXTransfer' in obj
}

const supportsPolkadotXCM = (obj: any): obj is IPolkadotXCMTransfer => {
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

  protected canUseXTokens(_: TSendInternalOptions): boolean {
    return true
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
      feeAsset,
      version = this.version,
      serializedApiCallEnabled = false
    } = options
    const scenario: TScenario = destination !== undefined ? 'ParaToPara' : 'ParaToRelay'
    const paraId =
      destination !== undefined && typeof destination !== 'object'
        ? paraIdTo ?? getParaId(destination)
        : undefined

    if (supportsXTokens(this) && this.canUseXTokens(options)) {
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
          version,
          paraId
        ),
        fees: getFees(scenario),
        origin: this.node,
        scenario,
        paraIdTo: paraId,
        destination,
        overridedCurrencyMultiLocation,
        feeAsset,
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
        header: this.createPolkadotXcmHeader(scenario, version, destination, paraId),
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'PolkadotXcm',
          address,
          version,
          paraId
        ),
        address,
        amount,
        currencySelection: this.createCurrencySpec(
          amount,
          scenario,
          version,
          currencyId,
          overridedCurrencyMultiLocation
        ),
        currencyId,
        scenario,
        currencySymbol,
        feeAsset,
        destination,
        paraIdTo: paraId,
        overridedCurrency: overridedCurrencyMultiLocation,
        serializedApiCallEnabled
      })
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'xcmPallet',
      section: 'reserveTransferAssets',
      parameters: constructRelayToParaParameters(options, version)
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
    overridedMultiLocation?: TMultiLocation | TMultiAsset[]
  ): TCurrencySelectionHeaderArr {
    return createCurrencySpec(
      amount,
      version,
      scenario === 'ParaToRelay' ? Parents.ONE : Parents.ZERO,
      overridedMultiLocation
    )
  }

  createPolkadotXcmHeader(
    scenario: TScenario,
    version: Version,
    destination?: TDestination,
    paraId?: number
  ): TMultiLocationHeader {
    return createPolkadotXcmHeader(scenario, version, destination, paraId)
  }
}

export default ParachainNode
