// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import type { TAmount } from '@paraspell/assets'
import {
  findAssetByMultiLocation,
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  type TAsset,
  type TMultiAsset
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import {
  isRelayChain,
  isTMultiLocation,
  Parents,
  type TEcosystemType,
  type TNodePolkadotKusama
} from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../constants'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import {
  constructRelayToParaParameters,
  createMultiAsset,
  createPolkadotXcmHeader,
  createVersionedMultiAssets
} from '../pallets/xcmPallet/utils'
import XTokensTransferImpl from '../pallets/xTokens'
import { getParaEthTransferFees } from '../transfer'
import type {
  IPolkadotXCMTransfer,
  IXTokensTransfer,
  IXTransferTransfer,
  TDestination,
  TPolkadotXCMTransferOptions,
  TRelayToParaOptions,
  TRelayToParaOverrides,
  TScenario,
  TSendInternalOptions,
  TSerializedApiCall,
  TXcmVersioned,
  TXTokensTransferOptions
} from '../types'
import { Version } from '../types'
import { createVersionedBeneficiary, getFees } from '../utils'
import { createCustomXcmOnDest } from '../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../utils/ethereum/generateMessageId'
import { resolveParaId } from '../utils/resolveParaId'
import { getParaId } from './config'

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
      feeAsset,
      address,
      to: destination,
      paraIdTo,
      overriddenAsset,
      version,
      senderAddress,
      pallet,
      method
    } = options
    const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)
    const scenario: TScenario = isRelayDestination ? 'ParaToRelay' : 'ParaToPara'
    const paraId = resolveParaId(paraIdTo, destination)

    if (
      destination === 'Polimec' &&
      this.node !== 'AssetHubPolkadot' &&
      this.node !== 'Hydration'
    ) {
      throw new Error(
        'Sending assets to Polimec is supported only from AssetHubPolkadot and Hydration'
      )
    }

    const versionOrDefault = version ?? this.version

    if (supportsXTokens(this) && this.canUseXTokens(options)) {
      const isBifrostOrigin = this.node === 'BifrostPolkadot' || this.node === 'BifrostKusama'
      const isAssetHubDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
      const shouldUseMultiasset = isAssetHubDest && !isBifrostOrigin

      const input: TXTokensTransferOptions<TApi, TRes> = {
        api,
        asset,
        addressSelection: createVersionedBeneficiary({
          api,
          scenario,
          pallet: 'XTokens',
          recipientAddress: address,
          version: versionOrDefault,
          paraId
        }),
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
        addressSelection: createVersionedBeneficiary({
          api,
          scenario,
          pallet: 'PolkadotXcm',
          recipientAddress: address,
          version: versionOrDefault,
          paraId
        }),
        address,
        currencySelection: this.createCurrencySpec(asset.amount, scenario, versionOrDefault, asset),
        overriddenAsset,
        asset,
        feeAsset,
        scenario,
        destination,
        paraIdTo: paraId,
        version,
        senderAddress,
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
    _asset?: TAsset
  ): TXcmVersioned<TMultiAsset[]> {
    return createVersionedMultiAssets(version, amount, {
      parents: scenario === 'ParaToRelay' ? Parents.ONE : Parents.ZERO,
      interior: 'Here'
    })
  }

  createPolkadotXcmHeader(
    scenario: TScenario,
    version: Version,
    destination: TDestination,
    paraId?: number
  ): TXcmVersioned<TMultiLocation> {
    return createPolkadotXcmHeader(scenario, version, destination, paraId)
  }

  getNativeAssetSymbol(): string {
    return getNativeAssetSymbol(this.node)
  }

  protected async transferToEthereum<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, asset, scenario, version, destination, address, senderAddress } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    if (senderAddress === undefined) {
      throw new Error('Sender address is required for transfers to Ethereum')
    }

    if (isTMultiLocation(address)) {
      throw new Error('Multi-location address is not supported for Ethereum transfers')
    }

    const versionOrDefault = version ?? Version.V4

    const ethMultiAsset = createMultiAsset(
      versionOrDefault,
      asset.amount,
      asset.multiLocation as TMultiLocation
    )

    const ahApi = await api.createApiForNode('AssetHubPolkadot')

    const [bridgeFee, executionFee] = await getParaEthTransferFees(ahApi)

    const fee = (bridgeFee + executionFee).toString()

    const ethAsset = findAssetByMultiLocation(
      getOtherAssets('Ethereum'),
      asset.multiLocation as TMultiLocation
    )

    if (!ethAsset || !ethAsset.assetId) {
      throw new InvalidCurrencyError(
        `Could not obtain Ethereum asset address for ${JSON.stringify(asset)}`
      )
    }

    const messageId = await generateMessageId(
      api,
      senderAddress,
      getParaId(this.node),
      ethAsset.assetId,
      address,
      asset.amount
    )

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
            createMultiAsset(versionOrDefault, fee, DOT_MULTILOCATION),
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
        custom_xcm_on_dest: createCustomXcmOnDest(input, versionOrDefault, messageId),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }
}

export default ParachainNode
