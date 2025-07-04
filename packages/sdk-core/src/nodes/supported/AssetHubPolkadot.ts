// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import type { TAmount, TAsset } from '@paraspell/assets'
import {
  findAssetByMultiLocation,
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  isSymbolMatch
} from '@paraspell/assets'
import type {
  TEcosystemType,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'
import {
  hasJunction,
  isSystemChain,
  isTMultiLocation,
  Parents,
  type TMultiLocation,
  Version
} from '@paraspell/sdk-common'

import { DOT_MULTILOCATION, ETHEREUM_JUNCTION } from '../../constants'
import { BridgeHaltedError, InvalidParameterError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import {
  createBridgeDestination,
  createDestination,
  createVersionedDestination
} from '../../pallets/xcmPallet/utils'
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
import { addXcmVersionHeader, assertHasLocation } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createBeneficiaryLocation, localizeLocation } from '../../utils/location'
import { createMultiAsset } from '../../utils/multiAsset'
import { resolveParaId } from '../../utils/resolveParaId'
import { handleExecuteTransfer } from '../../utils/transfer'
import { getParaId } from '../config'
import ParachainNode from '../ParachainNode'

const createCustomXcmToBifrost = <TApi, TRes>(
  { api, address }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: 'All' },
        beneficiary: createBeneficiaryLocation({
          api,
          address: address,
          version
        })
      }
    }
  ]
})

class AssetHubPolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor(
    chain: TNodePolkadotKusama = 'AssetHubPolkadot',
    info: string = 'PolkadotAssetHub',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  public handleBridgeTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    targetChain: 'Polkadot' | 'Kusama'
  ): Promise<TRes> {
    const { api, asset, destination, address, version, paraIdTo } = input
    if (
      (targetChain === 'Kusama' && asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Polkadot' && asset.symbol?.toUpperCase() === this.getNativeAssetSymbol())
    ) {
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        destLocation: createBridgeDestination(targetChain, destination, paraIdTo),
        beneficiaryLocation: createBeneficiaryLocation({
          api,
          address: address,
          version
        }),
        multiAsset: createMultiAsset(version, asset.amount, asset.multiLocation as TMultiLocation)
      }
      return transferPolkadotXcm(modifiedInput, 'transfer_assets', 'Unlimited')
    } else if (
      (targetChain === 'Polkadot' && asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Kusama' && asset.symbol?.toUpperCase() === this.getNativeAssetSymbol())
    ) {
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        destLocation: createBridgeDestination(targetChain, destination, paraIdTo),
        multiAsset: createMultiAsset(version, asset.amount, DOT_MULTILOCATION)
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
    const { api, version, destination, senderAddress, address, paraIdTo, asset } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    if (senderAddress === undefined) {
      throw new InvalidParameterError('Sender address is required for transfers to Ethereum')
    }

    if (isTMultiLocation(address)) {
      throw new InvalidParameterError(
        'Multi-location address is not supported for Ethereum transfers'
      )
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    assertHasLocation(asset)

    const messageId = await generateMessageId(
      api,
      senderAddress,
      getParaId(this.node),
      JSON.stringify(asset.multiLocation),
      address,
      asset.amount
    )

    const multiLocation =
      asset.symbol === this.getNativeAssetSymbol() ? DOT_MULTILOCATION : asset.multiLocation

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          this.version,
          this.node,
          destination,
          paraIdTo,
          ETHEREUM_JUNCTION,
          Parents.TWO
        ),
        assets: addXcmVersionHeader(
          [createMultiAsset(version, asset.amount, multiLocation)],
          version
        ),
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: addXcmVersionHeader(multiLocation, version),
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
    const { api, destination, paraIdTo, address, asset, version } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

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
        this.node,
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
      multiAsset: createMultiAsset(version, asset.amount, asset.multiLocation)
    }
    return transferPolkadotXcm(modifiedInput, 'transfer_assets', 'Unlimited')
  }

  handleMythosTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, address, asset, destination, paraIdTo, version } = input
    const paraId = resolveParaId(paraIdTo, destination)
    const customMultiLocation: TMultiLocation = {
      parents: Parents.ONE,
      interior: {
        X1: {
          Parachain: paraId
        }
      }
    }
    const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
      ...input,
      destLocation: createDestination(version, this.node, destination, paraId),
      beneficiaryLocation: createBeneficiaryLocation({
        api,
        address: address,
        version
      }),
      multiAsset: createMultiAsset(version, asset.amount, customMultiLocation)
    }
    return transferPolkadotXcm(modifiedInput, 'limited_teleport_assets', 'Unlimited')
  }

  handleLocalReserveTransfer = <TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    useDOTAsFeeAsset = false
  ): TRes => {
    const { api, version, destination, asset, paraIdTo } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    assertHasLocation(asset)

    const PARA_TO_PARA_FEE_DOT = 500000000n // 0.5 DOT

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(version, this.node, destination, paraIdTo),
        assets: addXcmVersionHeader(
          [
            ...(useDOTAsFeeAsset
              ? [createMultiAsset(version, PARA_TO_PARA_FEE_DOT, DOT_MULTILOCATION)]
              : []),
            createMultiAsset(version, asset.amount, asset.multiLocation)
          ],
          version
        ),

        assets_transfer_type: 'LocalReserve',
        remote_fees_id: addXcmVersionHeader(
          useDOTAsFeeAsset ? DOT_MULTILOCATION : asset.multiLocation,
          version
        ),
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: createCustomXcmToBifrost(input, version),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }

  patchInput<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): TPolkadotXCMTransferOptions<TApi, TRes> {
    const { asset, destination, version = this.version } = input

    if (
      (destination === 'Hydration' ||
        destination === 'Polimec' ||
        destination === 'Moonbeam' ||
        destination === 'BifrostPolkadot') &&
      asset.symbol === this.getNativeAssetSymbol()
    ) {
      return {
        ...input,
        multiAsset: createMultiAsset(version, asset.amount, DOT_MULTILOCATION)
      }
    }

    return input
  }

  private getMethod(scenario: TScenario, destination: TDestination): TPolkadotXcmMethod {
    const isTrusted = !isTMultiLocation(destination) && isSystemChain(destination)
    if (destination === 'Polimec' || destination === 'Moonbeam') return 'transfer_assets'
    return scenario === 'ParaToPara' && !isTrusted
      ? 'limited_reserve_transfer_assets'
      : 'limited_teleport_assets'
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, scenario, asset, destination, feeAsset, overriddenAsset } = input

    if (feeAsset) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden multi-assets with XCM execute')
      }

      if (isSymbolMatch(asset.symbol, 'KSM')) {
        return this.handleLocalReserveTransfer(input)
      }

      const isNativeAsset = isSymbolMatch(asset.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAsset.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.callTxMethod(await handleExecuteTransfer(this.node, input))
      }
    }

    if (destination === 'AssetHubKusama') {
      return this.handleBridgeTransfer<TApi, TRes>(input, 'Kusama')
    }

    if (destination === 'Ethereum') {
      return this.handleEthBridgeTransfer<TApi, TRes>(input)
    }

    if (destination === 'Mythos') {
      return this.handleMythosTransfer(input)
    }

    const isEthereumAsset =
      asset.multiLocation &&
      findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)

    if (destination === 'BifrostPolkadot' && isEthereumAsset) {
      return this.handleLocalReserveTransfer(input)
    }

    if (isEthereumAsset) {
      return this.handleLocalReserveTransfer(input, true)
    }

    const CHAINS_SUPPORT_DOT_TRANSFER = new Set<TNodeWithRelayChains>([
      'Hydration',
      'Polimec',
      'Moonbeam',
      'BifrostPolkadot',
      'PeoplePolkadot',
      'Ajuna'
    ] as const)

    const isTrusted = !isTMultiLocation(destination) && isSystemChain(destination)
    const isDotReserveAh =
      !isTMultiLocation(destination) && CHAINS_SUPPORT_DOT_TRANSFER.has(destination)

    if (
      scenario === 'ParaToPara' &&
      asset.symbol === this.getNativeAssetSymbol() &&
      !isForeignAsset(asset) &&
      !isDotReserveAh &&
      !isTrusted
    ) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Some Parachains do not have a reserve for DOT on AssetHub. This can also include multihop transfers that have AssetHub as a hop chain and the call contains DOT. Chains that do not have a DOT reserve on AssetHub are not allowed to transfer DOT to it or through it because this transfer will result in asset loss.'
      )
    }

    if (scenario === 'ParaToPara' && asset.symbol === 'KSM' && !isForeignAsset(asset)) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Bridged KSM cannot currently be transfered from AssetHubPolkadot, if you are sending different KSM asset, please specify {id: <KSMID>}.'
      )
    }

    const method = this.getMethod(scenario, destination)

    const modifiedInput = this.patchInput(input)

    return transferPolkadotXcm(modifiedInput, method, 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_teleport_assets', includeFee: true }
  }

  createCurrencySpec(
    amount: TAmount,
    scenario: TScenario,
    version: Version,
    asset?: TAsset,
    isOverriddenAsset?: boolean
  ) {
    if (scenario === 'ParaToPara') {
      // If the asset has overridden multi-locaiton, provide default multi-location
      // as it will be replaced later
      const multiLocation: TMultiLocation | undefined = isOverriddenAsset
        ? { parents: Parents.ZERO, interior: 'Here' }
        : asset?.multiLocation

      if (!multiLocation) {
        throw new InvalidCurrencyError('Asset does not have a multiLocation defined')
      }

      const transformedMultiLocation = hasJunction(multiLocation, 'Parachain', getParaId(this.node))
        ? localizeLocation(this.node, multiLocation)
        : multiLocation

      return createMultiAsset(version, amount, transformedMultiLocation)
    } else {
      return super.createCurrencySpec(amount, scenario, version, asset)
    }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (asset.assetId !== undefined) {
      return api.callTxMethod({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          id: Number(asset.assetId),
          target: { Id: address },
          amount: BigInt(asset.amount)
        }
      })
    }

    return api.callTxMethod({
      module: 'ForeignAssets',
      method: 'transfer',
      parameters: {
        id: asset.multiLocation,
        target: { Id: address },
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default AssetHubPolkadot
