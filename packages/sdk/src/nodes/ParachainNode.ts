// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import { type ApiPromise } from '@polkadot/api'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getNativeAssetSymbol, getParaId } from '../pallets/assets'
import {
  type TNode,
  type TRelayChainType,
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
  type TCurrencySelectionHeaderArr,
  type TNodePolkadotKusama,
  type TTransferReturn
} from '../types'
import {
  getAllNodeProviders,
  createApiInstance,
  generateAddressPayload,
  getFees,
  verifyMultiLocation
} from '../utils'
import {
  constructRelayToParaParameters,
  createCurrencySpec,
  createPolkadotXcmHeader,
  isTMultiLocation
} from '../pallets/xcmPallet/utils'
import { TMultiLocationHeader, type TMultiLocation } from '../types/TMultiLocation'
import { type TMultiAsset } from '../types/TMultiAsset'
import { InvalidCurrencyError } from '../errors'

const supportsXTokens = (obj: unknown): obj is IXTokensTransfer => {
  return typeof obj === 'object' && obj !== null && 'transferXTokens' in obj
}

const supportsXTransfer = (obj: unknown): obj is IXTransferTransfer => {
  return typeof obj === 'object' && obj !== null && 'transferXTransfer' in obj
}

const supportsPolkadotXCM = (obj: unknown): obj is IPolkadotXCMTransfer => {
  return typeof obj === 'object' && obj !== null && 'transferPolkadotXCM' in obj
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

  transfer(options: TSendInternalOptions): TTransferReturn {
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
        ? (paraIdTo ?? getParaId(destination))
        : undefined

    if (destination === 'Polimec' && this.node !== 'AssetHubPolkadot') {
      throw new Error('Sending assets to Polimec is supported only from AssetHubPolkadot')
    }

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
      if (
        isTMultiLocation(overridedCurrencyMultiLocation) &&
        !verifyMultiLocation(this.node, overridedCurrencyMultiLocation)
      ) {
        throw new InvalidCurrencyError('Provided Multi-location is not a valid currency.')
      }
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
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[0]
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

  getNativeAssetSymbol(): string {
    return getNativeAssetSymbol(this.node)
  }
}

export default ParachainNode
