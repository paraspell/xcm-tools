// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import type { TAssetInfo } from '@paraspell/assets'
import {
  getNativeAssetSymbol,
  getRelayChainSymbol,
  InvalidCurrencyError,
  isSymbolMatch
} from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import {
  deepEqual,
  hasJunction,
  isTLocation,
  isTrustedChain,
  Parents,
  type TLocation,
  Version
} from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { AH_REQUIRES_FEE_ASSET_LOCS, DOT_LOCATION, ETHEREUM_JUNCTION } from '../../constants'
import { BridgeHaltedError, InvalidParameterError } from '../../errors'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createDestination, createVersionedDestination } from '../../pallets/xcmPallet/utils'
import { createTypeAndThenCall } from '../../transfer'
import { getBridgeStatus } from '../../transfer/getBridgeStatus'
import type {
  TDestination,
  TPolkadotXcmMethod,
  TRelayToParaOverrides,
  TSerializedExtrinsics,
  TTransferLocalOptions
} from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TScenario
} from '../../types'
import {
  addXcmVersionHeader,
  assertHasLocation,
  assertIsForeign,
  assertSenderAddress
} from '../../utils'
import { createAsset } from '../../utils/asset'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createBeneficiaryLocation } from '../../utils/location'
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

  public async handleEthBridgeNativeTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, version, destination, senderAddress, address, paraIdTo, assetInfo: asset } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    assertSenderAddress(senderAddress)

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

    const call: TSerializedExtrinsics = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: {
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

    return api.deserializeExtrinsics(call)
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

    // TODO: Refactor this
    if (
      (destination === 'Hydration' ||
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
    const isTrusted = !isTLocation(destination) && isTrustedChain(destination)
    if (
      destination === 'Moonbeam' ||
      (typeof destination === 'string' && destination.startsWith('Integritee'))
    )
      return 'transfer_assets'
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
        return api.deserializeExtrinsics(call)
      }

      const isNativeAsset = isSymbolMatch(assetInfo.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAssetInfo.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.deserializeExtrinsics(await handleExecuteTransfer(this.chain, options))
      }
    }

    if (destination === 'Ethereum') {
      return this.handleEthBridgeTransfer(options)
    }

    if (destination === 'Mythos') {
      return this.handleMythosTransfer(options)
    }

    const isExternalAsset = assetInfo.location && assetInfo.location.parents === Parents.TWO

    const requiresTypeThen = AH_REQUIRES_FEE_ASSET_LOCS.some(loc =>
      deepEqual(loc, assetInfo.location)
    )

    if (isExternalAsset || requiresTypeThen) {
      const call = await createTypeAndThenCall(this.chain, options)
      return api.deserializeExtrinsics(call)
    }

    const method = this.getMethod(scenario, destination)

    // Patch transfer_assets to use type_and_then transfer
    if (
      method === 'transfer_assets' &&
      isSymbolMatch(assetInfo.symbol, getRelayChainSymbol(this.chain))
    ) {
      return api.deserializeExtrinsics(await createTypeAndThenCall(this.chain, options))
    }

    const modifiedInput = this.patchInput(options)

    return transferPolkadotXcm(modifiedInput, method, 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { transferType: 'teleport' }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertIsForeign(asset)

    if (asset.assetId !== undefined) {
      const assetId = Number(asset.assetId)
      const dest = { Id: address }
      if (isAmountAll) {
        return api.deserializeExtrinsics({
          module: 'Assets',
          method: 'transfer_all',
          params: {
            id: assetId,
            dest,
            keep_alive: false
          }
        })
      }

      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: assetId,
          target: dest,
          amount: asset.amount
        }
      })
    }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'ForeignAssets',
        method: 'transfer_all',
        params: {
          id: asset.location,
          dest: { Id: address },
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'ForeignAssets',
      method: 'transfer',
      params: {
        id: asset.location,
        target: { Id: address },
        amount: asset.amount
      }
    })
  }

  getBalanceForeign<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const ASSETS_PALLET_ID = 50

    const hasRequiredJunctions =
      asset.location &&
      hasJunction(asset.location, 'PalletInstance', ASSETS_PALLET_ID) &&
      hasJunction(asset.location, 'GeneralIndex')

    if (!asset.location || hasRequiredJunctions) {
      return getPalletInstance('Assets').getBalance(api, address, asset)
    }

    return getPalletInstance('ForeignAssets').getBalance(api, address, asset)
  }
}

export default AssetHubPolkadot
