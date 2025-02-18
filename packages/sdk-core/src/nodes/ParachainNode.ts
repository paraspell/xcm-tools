// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getNativeAssetSymbol } from '../pallets/assets'
import type {
  TEcosystemType,
  TScenario,
  IXTokensTransfer,
  IPolkadotXCMTransfer,
  IXTransferTransfer,
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
  TRelayToParaOverrides,
  TAmount,
  TRelayToParaOptions,
  TPallet,
  TPolkadotXCMTransferOptions
} from '../types'
import { Version, Parents } from '../types'
import { generateAddressPayload, getFees, isForeignAsset, isRelayChain } from '../utils'
import {
  constructRelayToParaParameters,
  createCurrencySpec,
  createPolkadotXcmHeader,
  isTMultiLocation
} from '../pallets/xcmPallet/utils'
import XTokensTransferImpl from '../pallets/xTokens'
import { resolveParaId } from '../utils/resolveParaId'
import { InvalidCurrencyError } from '../errors'
import { getParaId } from './config'
import { createCustomXcmOnDest } from '../utils/ethereum/createCustomXcmOnDest'
import { getParaEthTransferFees } from '../transfer'

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

  private readonly _type: TEcosystemType

  private readonly _version: Version

  protected _assetCheckEnabled = true

  constructor(node: TNodePolkadotKusama, info: string, type: TEcosystemType, version: Version) {
    this._info = info
    this._type = type
    this._node = node
    this._version = version
  }

  get info(): string {
    return this._info
  }

  get type(): TEcosystemType {
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
      address,
      destination,
      paraIdTo,
      overriddenAsset,
      version,
      ahAddress,
      pallet,
      method
    } = options
    const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)
    const scenario: TScenario = isRelayDestination ? 'ParaToRelay' : 'ParaToPara'
    const paraId = resolveParaId(paraIdTo, destination)

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
        overriddenAsset,
        pallet,
        method
      }

      if (shouldUseMultiasset) {
        return XTokensTransferImpl.transferXTokens(input, undefined)
      }

      return this.transferXTokens(input)
    } else if (supportsXTransfer(this)) {
      return this.transferXTransfer({
        api,
        asset,
        recipientAddress: address,
        paraId,
        origin: this.node,
        destination,
        overriddenAsset,
        pallet,
        method
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
        currencySelection: this.createCurrencySpec(
          asset.amount,
          scenario,
          versionOrDefault,
          asset,
          overriddenAsset
        ),
        asset,
        scenario,
        destination,
        paraIdTo: paraId,
        overriddenAsset,
        version,
        ahAddress,
        pallet,
        method
      })
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'reserve_transfer_assets', includeFee: false }
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version = Version.V3, pallet, method } = options
    const { section, includeFee } = this.getRelayToParaOverrides()
    return {
      module: (pallet as TPallet) ?? 'XcmPallet',
      section: method ?? section,
      parameters: constructRelayToParaParameters(options, version, { includeFee })
    }
  }

  createCurrencySpec(
    amount: TAmount,
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
    destination: TDestination,
    paraId?: number
  ): TMultiLocationHeader {
    return createPolkadotXcmHeader(scenario, version, destination, paraId)
  }

  getNativeAssetSymbol(): string {
    return getNativeAssetSymbol(this.node)
  }

  protected async transferToEthereum<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, asset, scenario, version, destination, ahAddress } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    if (ahAddress === undefined) {
      throw new Error('AssetHub address is required for Ethereum transfers')
    }

    const versionOrDefault = version ?? Version.V4

    const ethMultiAsset = Object.values(
      createCurrencySpec(
        asset.amount,
        versionOrDefault,
        Parents.TWO,
        asset.multiLocation as TMultiLocation
      )
    )[0][0]

    const ahApi = await api.createApiForNode('AssetHubPolkadot')

    const [bridgeFee, executionFee] = await getParaEthTransferFees(ahApi)

    const fee = (bridgeFee + executionFee).toString()

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      section: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createPolkadotXcmHeader(
          scenario,
          versionOrDefault,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: {
          [versionOrDefault]: [
            Object.values(this.createCurrencySpec(fee, 'ParaToRelay', versionOrDefault))[0][0],
            ethMultiAsset
          ]
        },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: {
          [versionOrDefault]: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: createCustomXcmOnDest(input, versionOrDefault),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }
}

export default ParachainNode
