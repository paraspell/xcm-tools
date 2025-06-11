// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import type { TAmount, TAsset } from '@paraspell/assets'
import {
  findAssetByMultiLocation,
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isAssetEqual,
  isForeignAsset,
  normalizeSymbol
} from '@paraspell/assets'
import {
  hasJunction,
  isTMultiLocation,
  Parents,
  type TMultiLocation,
  Version
} from '@paraspell/sdk-common'

import {
  DOT_MULTILOCATION,
  ETHEREUM_JUNCTION,
  MAX_WEIGHT,
  SYSTEM_NODES_POLKADOT
} from '../../constants'
import {
  BridgeHaltedError,
  DryRunFailedError,
  InvalidParameterError,
  ScenarioNotSupportedError
} from '../../errors'
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
import { addXcmVersionHeader, createBeneficiary } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createMultiAsset } from '../../utils/multiAsset'
import { createBeneficiaryMultiLocation, transformMultiLocation } from '../../utils/multiLocation'
import { resolveParaId } from '../../utils/resolveParaId'
import { createExecuteCall, createExecuteXcm } from '../../utils/transfer'
import { validateAddress } from '../../utils/validateAddress'
import { getParaId } from '../config'
import ParachainNode from '../ParachainNode'

const createCustomXcmToBifrost = <TApi, TRes>(
  { api, address, scenario }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: 'All' },
        beneficiary: createBeneficiaryMultiLocation({
          api,
          scenario,
          pallet: 'PolkadotXcm',
          recipientAddress: address,
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
  constructor() {
    super('AssetHubPolkadot', 'PolkadotAssetHub', 'polkadot', Version.V4)
  }

  public handleBridgeTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    targetChain: 'Polkadot' | 'Kusama'
  ): Promise<TRes> {
    const { api, asset, destination, scenario, address, version, paraIdTo } = input
    if (
      (targetChain === 'Kusama' && asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Polkadot' && asset.symbol?.toUpperCase() === 'DOT')
    ) {
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        destLocation: createBridgeDestination(targetChain, destination, paraIdTo),
        beneficiaryLocation: createBeneficiary({
          api,
          scenario,
          pallet: 'PolkadotXcm',
          recipientAddress: address,
          version,
          paraId: paraIdTo
        }),
        multiAsset: createMultiAsset(version, asset.amount, asset.multiLocation as TMultiLocation)
      }
      return transferPolkadotXcm(modifiedInput, 'transfer_assets', 'Unlimited')
    } else if (
      (targetChain === 'Polkadot' && asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Kusama' && asset.symbol?.toUpperCase() === 'DOT')
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
    const { api, version, scenario, destination, senderAddress, address, paraIdTo, asset } = input

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

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
    }

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
          scenario,
          this.version,
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
                beneficiary: createBeneficiaryMultiLocation({
                  api,
                  scenario,
                  pallet: 'PolkadotXcm',
                  recipientAddress: address,
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
    const { api, scenario, destination, paraIdTo, address, asset, version } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
    }

    if (
      asset.symbol === this.getNativeAssetSymbol() ||
      asset.symbol === getNativeAssetSymbol('Kusama')
    ) {
      return this.handleEthBridgeNativeTransfer(input)
    }

    const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
      ...input,
      destLocation: createDestination(
        scenario,
        this.version,
        destination,
        paraIdTo,
        ETHEREUM_JUNCTION,
        Parents.TWO
      ),
      beneficiaryLocation: createBeneficiary({
        api,
        scenario,
        pallet: 'PolkadotXcm',
        recipientAddress: address,
        version: this.version,
        paraId: paraIdTo
      }),
      multiAsset: createMultiAsset(version, asset.amount, asset.multiLocation)
    }
    return transferPolkadotXcm(modifiedInput, 'transfer_assets', 'Unlimited')
  }

  handleMythosTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, address, asset, scenario, destination, paraIdTo, version } = input
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
      destLocation: createDestination(scenario, version, destination, paraId),
      beneficiaryLocation: createBeneficiary({
        api,
        scenario,
        pallet: 'PolkadotXcm',
        recipientAddress: address,
        version,
        paraId
      }),
      multiAsset: createMultiAsset(version, asset.amount, customMultiLocation)
    }
    return transferPolkadotXcm(modifiedInput, 'limited_teleport_assets', 'Unlimited')
  }

  handleLocalReserveTransfer = <TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    useDOTAsFeeAsset = false
  ): TRes => {
    const { api, scenario, version, destination, asset, paraIdTo } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
    }

    const PARA_TO_PARA_FEE_DOT = 500000000n // 0.5 DOT

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(scenario, version, destination, paraIdTo),
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
      asset.symbol === 'DOT'
    ) {
      return {
        ...input,
        multiAsset: createMultiAsset(version, asset.amount, DOT_MULTILOCATION)
      }
    }

    return input
  }

  private getMethod(scenario: TScenario, destination: TDestination): TPolkadotXcmMethod {
    const isSystemNode =
      !isTMultiLocation(destination) && SYSTEM_NODES_POLKADOT.includes(destination)
    if (destination === 'Polimec' || destination === 'Moonbeam') return 'transfer_assets'
    return scenario === 'ParaToPara' && !isSystemNode
      ? 'limited_reserve_transfer_assets'
      : 'limited_teleport_assets'
  }

  private async handleExecuteTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TSerializedApiCall> {
    const { api, senderAddress, asset, feeAsset, version } = input

    if (!senderAddress) {
      throw new InvalidParameterError('Please provide senderAddress')
    }

    validateAddress(senderAddress, this.node, false)

    const decimals = asset.decimals as number
    const multiplier = decimals > 10 ? 0.4 : 0.15

    const base = BigInt(10 ** decimals)
    const scaledMultiplier = BigInt(Math.floor(multiplier * 10 ** decimals))
    const MIN_FEE = (base * scaledMultiplier) / BigInt(10 ** decimals)

    const checkAmount = (fee: bigint) => {
      if (feeAsset && isAssetEqual(asset, feeAsset) && BigInt(asset.amount) <= fee * 2n) {
        throw new InvalidParameterError(
          `Asset amount ${asset.amount} is too low, please increase the amount or use a different fee asset.`
        )
      }
    }

    checkAmount(MIN_FEE)

    const call = createExecuteCall(createExecuteXcm(input, MIN_FEE, version), MAX_WEIGHT)

    const dryRunResult = await api.getDryRunCall({
      node: this.node,
      tx: api.callTxMethod(call),
      address: senderAddress,
      asset,
      feeAsset
    })

    if (!dryRunResult.success) {
      throw new DryRunFailedError(dryRunResult.failureReason)
    }

    const paddedFee = (dryRunResult.fee * 120n) / 100n

    checkAmount(paddedFee)

    const xcm = createExecuteXcm(input, paddedFee, version)

    const weight = await api.getXcmWeight(xcm)

    return createExecuteCall(createExecuteXcm(input, paddedFee, version), weight)
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, scenario, asset, destination, feeAsset, overriddenAsset } = input

    if (feeAsset) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden multi-assets with XCM execute')
      }

      if (normalizeSymbol(asset.symbol) === normalizeSymbol('KSM')) {
        return this.handleLocalReserveTransfer(input)
      }

      const isNativeAsset = asset.symbol === this.getNativeAssetSymbol()

      if (!isNativeAsset) {
        return api.callTxMethod(await this.handleExecuteTransfer(input))
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

    const isSystemNode =
      !isTMultiLocation(destination) && SYSTEM_NODES_POLKADOT.includes(destination)

    if (
      scenario === 'ParaToPara' &&
      asset.symbol === 'DOT' &&
      !isForeignAsset(asset) &&
      destination !== 'Hydration' &&
      destination !== 'Polimec' &&
      destination !== 'Moonbeam' &&
      destination !== 'BifrostPolkadot' &&
      destination !== 'PeoplePolkadot' &&
      destination !== 'Ajuna' &&
      !isSystemNode
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

      const transformedMultiLocation = hasJunction(multiLocation, 'Parachain', 1000)
        ? transformMultiLocation(multiLocation)
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
