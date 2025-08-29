// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfo,
  findAssetInfoByLoc,
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isChainEvm,
  isForeignAsset,
  isSymbolMatch,
  type TAsset
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TRelaychain, Version } from '@paraspell/sdk-common'
import {
  isDotKsmBridge,
  isSystemChain,
  isTLocation,
  Parents,
  replaceBigInt,
  type TParachain
} from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../constants'
import {
  BridgeHaltedError,
  InvalidAddressError,
  InvalidParameterError,
  TransferToAhNotSupported
} from '../errors'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import {
  constructRelayToParaParameters,
  createDestination,
  createVersionedDestination
} from '../pallets/xcmPallet/utils'
import { transferXTokens } from '../pallets/xTokens'
import { createTypeAndThenCall, getParaEthTransferFees } from '../transfer'
import { getBridgeStatus } from '../transfer/getBridgeStatus'
import type {
  IPolkadotXCMTransfer,
  IXTokensTransfer,
  IXTransferTransfer,
  TPolkadotXCMTransferOptions,
  TRelayToParaOptions,
  TRelayToParaOverrides,
  TScenario,
  TSendInternalOptions,
  TSerializedApiCall,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../types'
import {
  addXcmVersionHeader,
  assertAddressIsString,
  assertHasId,
  assertHasLocation,
  createBeneficiaryLocation,
  getRelayChainOf
} from '../utils'
import { createAsset } from '../utils/asset'
import { createCustomXcmOnDest } from '../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../utils/ethereum/generateMessageId'
import { resolveParaId } from '../utils/resolveParaId'
import { resolveScenario } from '../utils/transfer/resolveScenario'
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

abstract class Parachain<TApi, TRes> {
  private readonly _chain: TParachain

  // Property _info maps our chain names to names which polkadot libs are using
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayKusama.ts
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayPolkadot.ts
  // These names can be found under object key 'info'
  private readonly _info: string

  private readonly _ecosystem: TRelaychain

  private readonly _version: Version

  constructor(chain: TParachain, info: string, ecosystem: TRelaychain, version: Version) {
    this._info = info
    this._ecosystem = ecosystem
    this._chain = chain
    this._version = version
  }

  get info(): string {
    return this._info
  }

  get ecosystem(): TRelaychain {
    return this._ecosystem
  }

  get chain(): TParachain {
    return this._chain
  }

  get version(): Version {
    return this._version
  }

  canUseXTokens(options: TSendInternalOptions<TApi, TRes>): boolean {
    const { assetInfo: asset } = options
    const isEthAsset =
      asset.location && findAssetInfoByLoc(getOtherAssets('Ethereum'), asset.location)

    return !isEthAsset && !this.shouldUseNativeAssetTeleport(options)
  }

  async transfer(sendOptions: TSendInternalOptions<TApi, TRes>): Promise<TRes> {
    const {
      api,
      assetInfo: asset,
      currency,
      feeAsset,
      feeCurrency,
      address,
      to: destination,
      paraIdTo,
      overriddenAsset,
      version,
      senderAddress,
      ahAddress,
      pallet,
      method
    } = sendOptions
    const scenario = resolveScenario(this.chain, destination)
    const paraId = resolveParaId(paraIdTo, destination)

    if (
      destination === 'Polimec' &&
      this.chain !== 'AssetHubPolkadot' &&
      this.chain !== 'Hydration' &&
      this.chain !== destination
    ) {
      throw new InvalidParameterError(
        'Sending assets to Polimec is supported only from AssetHubPolkadot and Hydration'
      )
    }

    const isLocalTransfer = this.chain === destination
    if (isLocalTransfer) {
      return this.transferLocal(sendOptions)
    }

    if (supportsXTokens(this) && this.canUseXTokens(sendOptions)) {
      const isBifrostOrigin = this.chain === 'BifrostPolkadot' || this.chain === 'BifrostKusama'
      const isJamtonOrigin = this.chain === 'Jamton'
      const isAssetHubDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
      const useMultiAssets = isAssetHubDest && !isBifrostOrigin && !isJamtonOrigin

      const input: TXTokensTransferOptions<TApi, TRes> = {
        api,
        asset,
        address,
        origin: this.chain,
        scenario,
        paraIdTo: paraId,
        version,
        destination,
        overriddenAsset,
        pallet,
        method
      }

      if (useMultiAssets) {
        return transferXTokens(input, undefined)
      }

      return this.transferXTokens(input)
    } else if (supportsXTransfer(this)) {
      return this.transferXTransfer({
        api,
        asset,
        recipientAddress: address,
        paraIdTo: paraId,
        origin: this.chain,
        destination,
        overriddenAsset,
        pallet,
        method
      })
    } else if (supportsPolkadotXCM(this)) {
      const options: TPolkadotXCMTransferOptions<TApi, TRes> = {
        api,
        destLocation: createDestination(version, this.chain, destination, paraId),
        beneficiaryLocation: createBeneficiaryLocation({
          api,
          address: address,
          version
        }),
        address,
        asset: this.createCurrencySpec(
          asset.amount,
          scenario,
          version,
          asset,
          overriddenAsset !== undefined
        ),
        overriddenAsset,
        assetInfo: asset,
        currency,
        feeAssetInfo: feeAsset,
        feeCurrency,
        scenario,
        destination,
        paraIdTo: paraId,
        version,
        senderAddress,
        ahAddress,
        pallet,
        method
      }

      const shouldUseTeleport = this.shouldUseNativeAssetTeleport(sendOptions)

      if (
        ((this.chain.includes('AssetHub') &&
          destination !== ('Mythos' as TParachain) &&
          typeof destination === 'string' &&
          !isSystemChain(destination)) ||
          (!isSystemChain(this.chain) &&
            this.chain !== ('Mythos' as TParachain) &&
            typeof destination === 'string' &&
            destination.includes('AssetHub'))) &&
        shouldUseTeleport
      ) {
        throw new TransferToAhNotSupported(
          'Native asset transfers to or from AssetHub are temporarily disabled'
        )
      }

      const isAHPOrigin = this.chain.includes('AssetHub')
      const isAHPDest = !isTLocation(destination) && destination.includes('AssetHub')

      // Handle common cases
      const isEthAsset =
        asset.location && findAssetInfoByLoc(getOtherAssets('Ethereum'), asset.location)

      const isEthDest = destination === 'Ethereum'

      // Eth asset - Any origin to any dest via AH - DestinationReserve - multiple instructions
      const isEthAssetViaAh = isEthAsset && !isAHPOrigin && !isAHPDest && !isEthDest && !feeAsset

      // Eth asset - Any origin to AHP - DestinationReserve - one DepositAsset instruction
      const isEthAssetToAh = isEthAsset && isAHPDest && !isAHPOrigin && !isEthDest && !feeAsset

      if (isEthAssetViaAh || isEthAssetToAh) {
        const call = await createTypeAndThenCall(this.chain, options)
        return api.callTxMethod(call)
      }

      return this.transferPolkadotXCM(options)
    } else {
      throw new NoXCMSupportImplementedError(this._chain)
    }
  }

  shouldUseNativeAssetTeleport({
    assetInfo: asset,
    to
  }: TSendInternalOptions<TApi, TRes>): boolean {
    if (isTLocation(to) || isDotKsmBridge(this.chain, to) || to === 'Ethereum') return false

    const isAHPOrigin = this.chain.includes('AssetHub')
    const isAHPDest = !isTLocation(to) && to.includes('AssetHub')

    const isNativeAsset =
      !isTLocation(to) &&
      ((isAHPOrigin &&
        isForeignAsset(asset) &&
        isSymbolMatch(asset.symbol, getNativeAssetSymbol(to))) ||
        (isAHPDest &&
          !isForeignAsset(asset) &&
          isSymbolMatch(asset.symbol, getNativeAssetSymbol(this.chain))))

    const assetHubChain = `AssetHub${getRelayChainOf(this.chain)}` as TParachain

    const isRegisteredOnAh =
      asset.location && findAssetInfo(assetHubChain, { location: asset.location }, null)

    return isNativeAsset && Boolean(isRegisteredOnAh) && (isAHPOrigin || isAHPDest)
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_reserve_transfer_assets', includeFee: true }
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version, pallet, method: methodOverride } = options
    const { method, includeFee } = this.getRelayToParaOverrides()
    return {
      module: (pallet as TPallet) ?? 'XcmPallet',
      method: methodOverride ?? method,
      parameters: constructRelayToParaParameters(options, version, { includeFee })
    }
  }

  createCurrencySpec(
    amount: bigint,
    scenario: TScenario,
    version: Version,
    _asset?: TAssetInfo,
    _isOverridenAsset?: boolean
  ): TAsset {
    return createAsset(version, amount, {
      parents: scenario === 'ParaToRelay' ? Parents.ONE : Parents.ZERO,
      interior: 'Here'
    })
  }

  getNativeAssetSymbol(): string {
    return getNativeAssetSymbol(this.chain)
  }

  transferLocal(options: TSendInternalOptions<TApi, TRes>): TRes {
    const { assetInfo: asset, address } = options

    if (isTLocation(address)) {
      throw new InvalidAddressError('Location address is not supported for local transfers')
    }

    const validatedOptions = { ...options, address }

    const isNativeAsset = asset.symbol === this.getNativeAssetSymbol() && !isForeignAsset(asset)

    if (isNativeAsset) {
      return this.transferLocalNativeAsset(validatedOptions)
    } else {
      return this.transferLocalNonNativeAsset(validatedOptions)
    }
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    return api.callTxMethod({
      module: 'Balances',
      method: 'transfer_keep_alive',
      parameters: {
        dest: isChainEvm(this.chain) ? address : { Id: address },
        value: asset.amount
      }
    })
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: BigInt(asset.assetId),
        amount: asset.amount
      }
    })
  }

  protected async transferToEthereum<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    useOnlyDepositInstruction = false
  ): Promise<TRes> {
    const {
      api,
      assetInfo: asset,
      version,
      destination,
      address,
      senderAddress,
      feeAssetInfo: feeAsset
    } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    assertHasLocation(asset)
    assertAddressIsString(address)

    if (senderAddress === undefined) {
      throw new InvalidParameterError('Sender address is required for transfers to Ethereum')
    }

    const ethAsset = createAsset(version, asset.amount, asset.location)

    const ahApi = await api.createApiForChain('AssetHubPolkadot')

    const [bridgeFee, executionFee] = await getParaEthTransferFees(ahApi)

    const PARA_TO_PARA_FEE_DOT = 5000000000n // 0.5 DOT

    const fee = useOnlyDepositInstruction ? PARA_TO_PARA_FEE_DOT : bridgeFee + executionFee

    const ethAssetInfo = findAssetInfoByLoc(getOtherAssets('Ethereum'), asset.location)

    if (!ethAssetInfo) {
      throw new InvalidCurrencyError(
        `Could not obtain Ethereum asset address for ${JSON.stringify(asset, replaceBigInt)}`
      )
    }

    let customXcmOnDest

    if (useOnlyDepositInstruction) {
      customXcmOnDest = addXcmVersionHeader(
        [
          {
            DepositAsset: {
              assets: { Wild: { AllCounted: 2 } },
              beneficiary: createBeneficiaryLocation({
                api,
                address: address,
                version
              })
            }
          }
        ],
        version
      )
    } else {
      assertHasId(ethAssetInfo)

      const messageId = await generateMessageId(
        api,
        senderAddress,
        getParaId(this.chain),
        ethAssetInfo.assetId,
        address,
        asset.amount
      )

      customXcmOnDest = createCustomXcmOnDest(input, this.chain, messageId)
    }

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          version,
          this.chain,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: addXcmVersionHeader(
          [...(!feeAsset ? [createAsset(version, fee, DOT_LOCATION)] : []), ethAsset],
          version
        ),

        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: addXcmVersionHeader(feeAsset?.location ?? DOT_LOCATION, version),
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: customXcmOnDest,
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }
}

export default Parachain
