// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getNativeAssetSymbol } from '../pallets/assets'
import type {
  TRelayChainType,
  TScenario,
  IXTokensTransfer,
  IPolkadotXCMTransfer,
  IXTransferTransfer,
  TRelayToParaOptions,
  TSendInternalOptions,
  TDestination,
  TCurrencySelectionHeaderArr,
  TNodePolkadotKusama,
  TMultiAsset,
  TMultiLocation,
  TMultiLocationHeader,
  TSerializedApiCall,
  TAsset,
  TXTokensTransferOptions,
  TRelayToParaOverrides
} from '../types'
import { Version, Parents } from '../types'
import { generateAddressPayload, getFees } from '../utils'
import {
  constructRelayToParaParameters,
  createCurrencySpec,
  createPolkadotXcmHeader
} from '../pallets/xcmPallet/utils'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import XTokensTransferImpl from './xTokens'
import { getNodeProviders, getParaId } from './config'

const supportsXTokens = (obj: unknown): obj is IXTokensTransfer => {
  return typeof obj === 'object' && obj !== null && 'transferXTokens' in obj
}

const supportsXTransfer = (obj: unknown): obj is IXTransferTransfer => {
  return typeof obj === 'object' && obj !== null && 'transferXTransfer' in obj
}

const supportsPolkadotXCM = (obj: unknown): obj is IPolkadotXCMTransfer => {
  return typeof obj === 'object' && obj !== null && 'transferPolkadotXCM' in obj
}

abstract class ParachainNode<TApi, TRes> {
  private readonly _node: TNodePolkadotKusama

  // Property _info maps our node names to names which polkadot libs are using
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayKusama.ts
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayPolkadot.ts
  // These names can be found under object key 'info'
  private readonly _info: string

  private readonly _type: TRelayChainType

  private readonly _version: Version

  protected _assetCheckEnabled = true

  constructor(node: TNodePolkadotKusama, info: string, type: TRelayChainType, version: Version) {
    this._info = info
    this._type = type
    this._node = node
    this._version = version
  }

  get info(): string {
    return this._info
  }

  get type(): TRelayChainType {
    return this._type
  }

  get node(): TNodePolkadotKusama {
    return this._node
  }

  get version(): Version {
    return this._version
  }

  get assetCheckEnabled(): boolean {
    return this._assetCheckEnabled
  }

  protected canUseXTokens(_: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  async transfer(options: TSendInternalOptions<TApi, TRes>): Promise<TRes> {
    const {
      api,
      asset,
      amount,
      address,
      destination,
      paraIdTo,
      overridedCurrencyMultiLocation,
      feeAsset,
      version,
      ahAddress
    } = options
    const scenario: TScenario = destination !== undefined ? 'ParaToPara' : 'ParaToRelay'
    const paraId =
      destination !== undefined && typeof destination !== 'object' && destination !== 'Ethereum'
        ? (paraIdTo ?? getParaId(destination))
        : undefined

    if (destination === 'Polimec' && this.node !== 'AssetHubPolkadot') {
      throw new Error('Sending assets to Polimec is supported only from AssetHubPolkadot')
    }

    const versionOrDefault = version ?? this.version

    if (supportsXTokens(this) && this.canUseXTokens(options)) {
      const isBifrostOrigin = this.node === 'BifrostPolkadot' || this.node === 'BifrostKusama'
      const isAssetHubDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
      const shouldUseMultiasset = isAssetHubDest && !isBifrostOrigin

      const input: TXTokensTransferOptions<TApi, TRes> = {
        api,
        asset,
        amount,
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'XTokens',
          address,
          versionOrDefault,
          paraId
        ),
        fees: getFees(scenario),
        origin: this.node,
        scenario,
        paraIdTo: paraId,
        destination,
        overridedCurrencyMultiLocation,
        feeAsset
      }

      if (shouldUseMultiasset) {
        return XTokensTransferImpl.transferXTokens(input, undefined)
      }

      return this.transferXTokens(input)
    } else if (supportsXTransfer(this)) {
      return this.transferXTransfer({
        api,
        asset,
        amount,
        recipientAddress: address,
        paraId,
        origin: this.node,
        destination,
        overridedCurrencyMultiLocation
      })
    } else if (supportsPolkadotXCM(this)) {
      return this.transferPolkadotXCM({
        api,
        header: this.createPolkadotXcmHeader(scenario, versionOrDefault, destination, paraId),
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'PolkadotXcm',
          address,
          versionOrDefault,
          paraId
        ),
        address,
        amount,
        currencySelection: this.createCurrencySpec(
          amount,
          scenario,
          versionOrDefault,
          asset,
          overridedCurrencyMultiLocation
        ),
        asset,
        scenario,
        feeAsset,
        destination,
        paraIdTo: paraId,
        overridedCurrency: overridedCurrencyMultiLocation,
        version,
        ahAddress
      })
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'reserve_transfer_assets', includeFee: false }
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version = Version.V3 } = options
    const { section, includeFee } = this.getRelayToParaOverrides()
    return {
      module: 'XcmPallet',
      section,
      parameters: constructRelayToParaParameters(options, version, { includeFee })
    }
  }

  getProvider(): string {
    const providers = getNodeProviders(this.node)
    if (providers.length === 0) {
      throw new Error(`No providers found for node ${this.node}`)
    }
    return providers[0]
  }

  async createApiInstance(api: IPolkadotApi<TApi, TRes>): Promise<TApi> {
    return api.createApiInstance(this.getProvider())
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    _asset?: TAsset,
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
