// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import type { TAssetInfo } from '@paraspell/assets'
import {
  getNativeAssetSymbol,
  getRelayChainSymbol,
  InvalidCurrencyError,
  isForeignAsset,
  isSymbolMatch
} from '@paraspell/assets'
import type { TChain, TParachain, TRelaychain } from '@paraspell/sdk-common'
import {
  hasJunction,
  isSystemChain,
  isTLocation,
  Parents,
  type TLocation,
  Version
} from '@paraspell/sdk-common'

import { DOT_LOCATION, ETHEREUM_JUNCTION } from '../../constants'
import { BridgeHaltedError, InvalidParameterError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import {
  createBridgeDestination,
  createDestination,
  createVersionedDestination
} from '../../pallets/xcmPallet/utils'
import { createTypeAndThenCall } from '../../transfer'
import { getBridgeStatus } from '../../transfer/getBridgeStatus'
import type {
  TDestination,
  TPolkadotXcmMethod,
  TRelayToParaOverrides,
  TSerializedApiCall,
  TTransferLocalOptions
} from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TScenario
} from '../../types'
import { addXcmVersionHeader, assertHasLocation, assertIsForeign } from '../../utils'
import { createAsset } from '../../utils/asset'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createBeneficiaryLocation, localizeLocation } from '../../utils/location'
import { resolveParaId } from '../../utils/resolveParaId'
import { handleExecuteTransfer } from '../../utils/transfer'
import { getParaId } from '../config'
import Parachain from '../Parachain'

class AssetHubPolkadot<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'AssetHubPolkadot',
    info: string = 'PolkadotAssetHub',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  public handleBridgeTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    targetChain: 'Polkadot' | 'Kusama'
  ): Promise<TRes> {
    const { api, assetInfo: asset, destination, address, version, paraIdTo } = input
    if (
      (targetChain === 'Kusama' && asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Polkadot' && asset.symbol?.toUpperCase() === 'DOT')
    ) {
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        destLocation: createBridgeDestination(targetChain, destination, paraIdTo),
        beneficiaryLocation: createBeneficiaryLocation({
          api,
          address: address,
          version
        }),
        asset: createAsset(version, asset.amount, asset.location as TLocation)
      }
      return transferPolkadotXcm(modifiedInput, 'transfer_assets', 'Unlimited')
    } else if (
      (targetChain === 'Polkadot' && asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Kusama' && 'DOT')
    ) {
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        destLocation: createBridgeDestination(targetChain, destination, paraIdTo),
        asset: createAsset(version, asset.amount, DOT_LOCATION)
      }

      return transferPolkadotXcm(modifiedInput, 'limited_reserve_transfer_assets', 'Unlimited')
    }
    throw new InvalidCurrencyError(
      `Polkadot <-> Kusama bridge does not support currency ${asset.symbol}`
    )
  }

  public async handleEthBridgeNativeTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, version, destination, senderAddress, address, paraIdTo, assetInfo: asset } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    if (senderAddress === undefined) {
      throw new InvalidParameterError('Sender address is required for transfers to Ethereum')
    }

    if (isTLocation(address)) {
      throw new InvalidParameterError('Location address is not supported for Ethereum transfers')
    }

    assertIsForeign(asset)
    assertHasLocation(asset)

    const messageId = await generateMessageId(
      api,
      senderAddress,
      getParaId(this.chain),
      JSON.stringify(asset.location),
      address,
      asset.amount
    )

    const location = asset.symbol === this.getNativeAssetSymbol() ? DOT_LOCATION : asset.location

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          this.version,
          this.chain,
          destination,
          paraIdTo,
          ETHEREUM_JUNCTION,
          Parents.TWO
        ),
        assets: addXcmVersionHeader([createAsset(version, asset.amount, location)], version),
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: addXcmVersionHeader(location, version),
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: addXcmVersionHeader(
          [
            {
              DepositAsset: {
                assets: { Wild: { AllCounted: 1 } },
                beneficiary: createBeneficiaryLocation({
                  api,
                  address: address,
                  version
                })
              }
            },
            {
              SetTopic: messageId
            }
          ],
          version
        ),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }

  public async handleEthBridgeTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, destination, paraIdTo, address, assetInfo: asset, version } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    assertIsForeign(asset)
    assertHasLocation(asset)

    if (
      asset.symbol === this.getNativeAssetSymbol() ||
      asset.symbol === getNativeAssetSymbol('Kusama')
    ) {
      return this.handleEthBridgeNativeTransfer(input)
    }

    const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
      ...input,
      destLocation: createDestination(
        this.version,
        this.chain,
        destination,
        paraIdTo,
        ETHEREUM_JUNCTION,
        Parents.TWO
      ),
      beneficiaryLocation: createBeneficiaryLocation({
        api,
        address: address,
        version: this.version
      }),
      asset: createAsset(version, asset.amount, asset.location)
    }
    return transferPolkadotXcm(modifiedInput, 'transfer_assets', 'Unlimited')
  }

  handleMythosTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, address, assetInfo: asset, destination, paraIdTo, version } = input
    const paraId = resolveParaId(paraIdTo, destination)
    const customLocation: TLocation = {
      parents: Parents.ONE,
      interior: {
        X1: {
          Parachain: paraId
        }
      }
    }
    const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
      ...input,
      destLocation: createDestination(version, this.chain, destination, paraId),
      beneficiaryLocation: createBeneficiaryLocation({
        api,
        address: address,
        version
      }),
      asset: createAsset(version, asset.amount, customLocation)
    }
    return transferPolkadotXcm(modifiedInput, 'limited_teleport_assets', 'Unlimited')
  }

  patchInput<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): TPolkadotXCMTransferOptions<TApi, TRes> {
    const { assetInfo, destination, version } = input

    if (
      (destination === 'Hydration' ||
        destination === 'Polimec' ||
        destination === 'Moonbeam' ||
        destination === 'BifrostPolkadot') &&
      assetInfo.symbol === this.getNativeAssetSymbol()
    ) {
      return {
        ...input,
        asset: createAsset(version, assetInfo.amount, DOT_LOCATION)
      }
    }

    return input
  }

  private getMethod(scenario: TScenario, destination: TDestination): TPolkadotXcmMethod {
    const isTrusted = !isTLocation(destination) && isSystemChain(destination)
    if (destination === 'Polimec' || destination === 'Moonbeam') return 'transfer_assets'
    return scenario === 'ParaToPara' && !isTrusted
      ? 'limited_reserve_transfer_assets'
      : 'limited_teleport_assets'
  }

  async transferPolkadotXCM<TApi, TRes>(
    options: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, scenario, assetInfo, destination, feeAssetInfo, overriddenAsset } = options

    if (feeAssetInfo) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden multi-assets with XCM execute')
      }

      if (isSymbolMatch(assetInfo.symbol, 'KSM')) {
        const call = await createTypeAndThenCall(this.chain, options)
        return api.callTxMethod(call)
      }

      const isNativeAsset = isSymbolMatch(assetInfo.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAssetInfo.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.callTxMethod(await handleExecuteTransfer(this.chain, options))
      }
    }

    if (destination === 'AssetHubKusama') {
      return this.handleBridgeTransfer<TApi, TRes>(options, 'Kusama')
    }

    if (destination === 'Ethereum') {
      return this.handleEthBridgeTransfer<TApi, TRes>(options)
    }

    if (destination === 'Mythos') {
      return this.handleMythosTransfer(options)
    }

    const isExternalAsset = assetInfo.location && assetInfo.location.parents === Parents.TWO

    if (isExternalAsset) {
      const call = await createTypeAndThenCall(this.chain, options)
      return api.callTxMethod(call)
    }

    const CHAINS_SUPPORT_DOT_TRANSFER = new Set<TChain>([
      'Hydration',
      'Polimec',
      'Moonbeam',
      'BifrostPolkadot',
      'PeoplePolkadot',
      'Ajuna'
    ] as const)

    const isTrusted = !isTLocation(destination) && isSystemChain(destination)
    const isDotReserveAh = !isTLocation(destination) && CHAINS_SUPPORT_DOT_TRANSFER.has(destination)

    if (
      scenario === 'ParaToPara' &&
      assetInfo.symbol === this.getNativeAssetSymbol() &&
      !isForeignAsset(assetInfo) &&
      !isDotReserveAh &&
      !isTrusted
    ) {
      throw new ScenarioNotSupportedError(
        this.chain,
        scenario,
        'Some Parachains do not have a reserve for DOT on AssetHub. This can also include multihop transfers that have AssetHub as a hop chain and the call contains DOT. Chains that do not have a DOT reserve on AssetHub are not allowed to transfer DOT to it or through it because this transfer will result in asset loss.'
      )
    }

    if (scenario === 'ParaToPara' && assetInfo.symbol === 'KSM' && !isForeignAsset(assetInfo)) {
      throw new ScenarioNotSupportedError(
        this.chain,
        scenario,
        'Bridged KSM cannot currently be transfered from AssetHubPolkadot, if you are sending different KSM asset, please specify {id: <KSMID>}.'
      )
    }

    const method = this.getMethod(scenario, destination)

    // Patch transfer_assets to use type_and_then transfer
    if (
      method === 'transfer_assets' &&
      isSymbolMatch(assetInfo.symbol, getRelayChainSymbol(this.chain))
    ) {
      return api.callTxMethod(await createTypeAndThenCall(this.chain, options))
    }

    const modifiedInput = this.patchInput(options)

    return transferPolkadotXcm(modifiedInput, method, 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_teleport_assets', includeFee: true }
  }

  createCurrencySpec(
    amount: bigint,
    scenario: TScenario,
    version: Version,
    asset?: TAssetInfo,
    isOverriddenAsset?: boolean
  ) {
    if (scenario === 'ParaToPara') {
      // If the asset has overridden location, provide default location
      // as it will be replaced later
      const location: TLocation | undefined = isOverriddenAsset
        ? { parents: Parents.ZERO, interior: 'Here' }
        : asset?.location

      if (!location) {
        throw new InvalidCurrencyError('Asset does not have a location defined')
      }

      const transformedLocation = hasJunction(location, 'Parachain', getParaId(this.chain))
        ? localizeLocation(this.chain, location)
        : location

      return createAsset(version, amount, transformedLocation)
    } else {
      return super.createCurrencySpec(amount, scenario, version, asset)
    }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    assertIsForeign(asset)

    if (asset.assetId !== undefined) {
      return api.callTxMethod({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          id: Number(asset.assetId),
          target: { Id: address },
          amount: asset.amount
        }
      })
    }

    return api.callTxMethod({
      module: 'ForeignAssets',
      method: 'transfer',
      parameters: {
        id: asset.location,
        target: { Id: address },
        amount: asset.amount
      }
    })
  }
}

export default AssetHubPolkadot
