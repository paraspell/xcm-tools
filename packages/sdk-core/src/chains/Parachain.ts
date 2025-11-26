// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import {
  findAssetInfo,
  findAssetInfoByLoc,
  getNativeAssetSymbol,
  getOtherAssets,
  getRelayChainSymbol,
  InvalidCurrencyError,
  isChainEvm,
  isForeignAsset,
  isSymbolMatch,
  type TAsset
} from '@paraspell/assets'
import { getOtherAssetsPallets, type TPallet } from '@paraspell/pallets'
import type { TChain, TRelaychain, Version } from '@paraspell/sdk-common'
import {
  deepEqual,
  isExternalChain,
  isRelayChain,
  isSubstrateBridge,
  isTLocation,
  isTrustedChain,
  Parents,
  replaceBigInt,
  type TParachain
} from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import { getAssetBalanceInternal } from '../balance'
import { DOT_LOCATION, MIN_AMOUNT, RELAY_LOCATION } from '../constants'
import {
  BridgeHaltedError,
  IncompatibleChainsError,
  InvalidAddressError,
  InvalidParameterError,
  TransferToAhNotSupported
} from '../errors'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { getPalletInstance } from '../pallets'
import {
  constructRelayToParaParams,
  createDestination,
  createVersionedDestination
} from '../pallets/xcmPallet/utils'
import { transferXTokens } from '../pallets/xTokens'
import {
  createTypeAndThenCall,
  createTypeThenAutoReserve,
  getParaEthTransferFees
} from '../transfer'
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
  TSerializedExtrinsics,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../types'
import {
  addXcmVersionHeader,
  assertAddressIsString,
  assertHasId,
  assertHasLocation,
  assertSenderAddress,
  createBeneficiaryLocation,
  getChain,
  getRelayChainOf,
  resolveDestChain
} from '../utils'
import { createAsset } from '../utils/asset'
import { createCustomXcmOnDest } from '../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../utils/ethereum/generateMessageId'
import { localizeLocation } from '../utils/location'
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
    const isExternalAsset = asset.location?.parents === Parents.TWO
    return !isExternalAsset && !this.shouldUseNativeAssetTeleport(options)
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
    const destChain = resolveDestChain(this.chain, paraId)

    const isLocalTransfer = this.chain === destination
    if (isLocalTransfer) {
      return this.transferLocal(sendOptions)
    }

    this.throwIfTempDisabled(sendOptions, destChain)
    this.throwIfCantReceive(destChain)

    const isRelayAsset =
      deepEqual(asset.location, RELAY_LOCATION) &&
      isSymbolMatch(getRelayChainSymbol(this.chain), asset.symbol)
    const supportsTypeThen = await api.hasMethod(
      'PolkadotXcm',
      'transfer_assets_using_type_and_then'
    )

    if (isRelayAsset && !supportsTypeThen) {
      throw new InvalidParameterError(
        'Relaychain assets can only be transferred using the type-and-then method which is not supported by this chain'
      )
    }

    const isSubBridge = !isTLocation(destination) && isSubstrateBridge(this.chain, destination)

    const useTypeAndThen =
      (isRelayAsset &&
        supportsTypeThen &&
        destChain &&
        !feeAsset &&
        (!isTrustedChain(this.chain) || !isTrustedChain(destChain))) ||
      isSubBridge

    if (supportsXTokens(this) && this.canUseXTokens(sendOptions) && !useTypeAndThen) {
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
    } else if (supportsPolkadotXCM(this) || useTypeAndThen) {
      const options: TPolkadotXCMTransferOptions<TApi, TRes> = {
        api,
        destLocation: createDestination(version, this.chain, destination, paraId),
        beneficiaryLocation: createBeneficiaryLocation({
          api,
          address,
          version
        }),
        address,
        asset: this.createAsset(asset, version),
        overriddenAsset,
        assetInfo: asset,
        currency,
        feeAssetInfo: feeAsset,
        feeCurrency,
        scenario,
        destination,
        destChain,
        paraIdTo: paraId,
        version,
        senderAddress,
        ahAddress,
        pallet,
        method
      }

      const shouldUseTeleport = this.shouldUseNativeAssetTeleport(sendOptions)

      const isAhToOtherPara =
        this.chain.startsWith('AssetHub') && destChain && !isTrustedChain(destChain)

      const isOtherParaToAh = destChain?.startsWith('AssetHub') && !isTrustedChain(this.chain)

      const isAllowedAhTransfer = (chain: TChain | undefined) => chain?.startsWith('Integritee')

      if (
        (isAhToOtherPara || isOtherParaToAh) &&
        shouldUseTeleport &&
        !isAllowedAhTransfer(destChain) &&
        !isAllowedAhTransfer(this.chain)
      ) {
        throw new TransferToAhNotSupported(
          'Native asset transfers to or from AssetHub are temporarily disabled'
        )
      }

      if (this.chain === 'Astar' && isRelayAsset) {
        throw new InvalidParameterError('Astar system asset transfers are temporarily disabled')
      }

      const isAHOrigin = this.chain.includes('AssetHub')
      const isAHDest = !isTLocation(destination) && destination.includes('AssetHub')

      // Handle common cases
      const isExternalAsset = asset.location?.parents === Parents.TWO

      const isEthDest = destination === 'Ethereum'

      // External asset - Any origin to any dest via AH - DestinationReserve - multiple instructions
      const isExternalAssetViaAh =
        isExternalAsset && !isAHOrigin && !isAHDest && !isEthDest && !feeAsset

      // External asset - Any origin to AHP - DestinationReserve - one DepositAsset instruction
      const isExternalAssetToAh =
        isExternalAsset && isAHDest && !isAHOrigin && !isEthDest && !feeAsset

      if (isExternalAssetViaAh || isExternalAssetToAh || useTypeAndThen) {
        // Validate that the chain-specific transfer wouldn't reject this scenario.
        if (useTypeAndThen && supportsPolkadotXCM(this) && !isSubBridge) {
          await this.transferPolkadotXCM(options) // ignore result
        }

        const call = await createTypeAndThenCall(this.chain, options)

        return api.deserializeExtrinsics(call)
      }

      if (supportsPolkadotXCM(this)) {
        return this.transferPolkadotXCM(options)
      }
    }

    throw new NoXCMSupportImplementedError(this._chain)
  }

  throwIfCantReceive(destChain: TChain | undefined): void {
    if (destChain && !isRelayChain(destChain) && !isExternalChain(destChain)) {
      const dest = getChain(destChain)
      if (!dest.canReceiveFrom(this.chain)) {
        throw new IncompatibleChainsError(
          `Receiving on ${destChain} from ${this.chain} is not yet enabled`
        )
      }
    }
  }

  throwIfTempDisabled(options: TSendInternalOptions<TApi, TRes>, destChain?: TChain): void {
    const isSendingDisabled = this.isSendingTempDisabled(options)
    if (isSendingDisabled) {
      throw new InvalidParameterError(`Sending from ${this.chain} is temporarily disabled`)
    }

    const scenario = resolveScenario(this.chain, options.to)

    const isReceivingDisabled =
      destChain &&
      !isRelayChain(destChain) &&
      !isExternalChain(destChain) &&
      getChain(destChain).isReceivingTempDisabled(scenario)
    if (isReceivingDisabled) {
      throw new InvalidParameterError(`Receiving on ${destChain} is temporarily disabled`)
    }
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }

  canReceiveFrom(_origin: TChain): boolean {
    // Default: destination accepts from any origin
    return true
  }

  shouldUseNativeAssetTeleport({
    assetInfo: asset,
    to
  }: TSendInternalOptions<TApi, TRes>): boolean {
    if (isTLocation(to) || isSubstrateBridge(this.chain, to) || to === 'Ethereum') return false

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
    return { transferType: 'typeAndThen' }
  }

  async transferRelayToPara(
    options: TRelayToParaOptions<TApi, TRes>
  ): Promise<TSerializedExtrinsics> {
    const {
      api,
      version,
      pallet,
      assetInfo,
      address,
      senderAddress,
      destination,
      paraIdTo,
      method
    } = options
    const { transferType } = this.getRelayToParaOverrides()

    if (this.isReceivingTempDisabled('RelayToPara')) {
      throw new InvalidParameterError(`Receiving on ${this.chain} is temporarily disabled`)
    }

    if (transferType === 'typeAndThen') {
      const paraId = resolveParaId(paraIdTo, destination)
      const destChain = resolveDestChain(this.chain, paraId)
      const scenario: TScenario = 'RelayToPara'

      if (!destChain) {
        throw new InvalidParameterError(
          'Cannot override destination when using type and then transfer.'
        )
      }

      return createTypeThenAutoReserve(getRelayChainOf(destChain), {
        ...options,
        beneficiaryLocation: createBeneficiaryLocation({
          api,
          address,
          version
        }),
        senderAddress,
        asset: this.createAsset(assetInfo, version),
        destLocation: createDestination(version, this.chain, destination, paraId),
        scenario,
        destChain,
        paraIdTo: paraId
      })
    }

    return {
      module: (pallet as TPallet) ?? 'XcmPallet',
      method: method ?? 'limited_teleport_assets',
      params: constructRelayToParaParams(options, version)
    }
  }

  createAsset(asset: WithAmount<TAssetInfo>, version: Version): TAsset {
    assertHasLocation(asset)
    const { amount, location } = asset
    return createAsset(version, amount, localizeLocation(this.chain, location))
  }

  getNativeAssetSymbol(): string {
    return getNativeAssetSymbol(this.chain)
  }

  async transferLocal(options: TSendInternalOptions<TApi, TRes>): Promise<TRes> {
    const { api, assetInfo: asset, feeAsset, address, senderAddress, isAmountAll } = options

    if (isTLocation(address)) {
      throw new InvalidAddressError('Location address is not supported for local transfers')
    }

    if (feeAsset) {
      throw new InvalidParameterError('Fee asset is not supported for local transfers')
    }

    const validatedOptions = { ...options, address }

    const isNativeAsset = asset.symbol === this.getNativeAssetSymbol() && !isForeignAsset(asset)

    let balance: bigint
    if (isAmountAll) {
      assertSenderAddress(senderAddress)
      balance = await getAssetBalanceInternal({
        api,
        chain: this.chain,
        address: senderAddress,
        asset
      })
    } else {
      balance = MIN_AMOUNT
    }

    const localOptions = {
      ...validatedOptions,
      balance
    }

    if (isNativeAsset) {
      return this.transferLocalNativeAsset(localOptions)
    } else {
      return this.transferLocalNonNativeAsset(localOptions)
    }
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    const { api, assetInfo: asset, address, isAmountAll } = options

    const dest = isChainEvm(this.chain) ? address : { Id: address }

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest,
            keep_alive: false
          }
        })
      )
    }

    return Promise.resolve(
      api.deserializeExtrinsics({
        module: 'Balances',
        method: 'transfer_keep_alive',
        params: {
          dest,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const dest = { Id: address }
    const currencyId = BigInt(asset.assetId)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest,
          currency_id: currencyId,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: 'transfer',
      params: {
        dest,
        currency_id: currencyId,
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
    assertSenderAddress(senderAddress)

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
                address,
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

    const call: TSerializedExtrinsics = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: {
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

    return api.deserializeExtrinsics(call)
  }

  getBalanceNative(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const palletInstance = getPalletInstance('System')
    return palletInstance.getBalance(api, address, asset)
  }

  getCustomCurrencyId(_asset: TAssetInfo): unknown {
    return undefined
  }

  async getBalanceForeign<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ) {
    const pallets = getOtherAssetsPallets(this.chain)
    let lastError: unknown

    if (pallets.length === 0)
      throw new InvalidParameterError(`No foreign asset pallets found for ${this.chain}`)

    const customCurrencyId = this.getCustomCurrencyId(asset)

    for (const pallet of pallets) {
      const instance = getPalletInstance(pallet)

      try {
        return await instance.getBalance(api, address, asset, customCurrencyId)
      } catch (e) {
        lastError = e
      }
    }

    throw lastError
  }

  getBalance(api: IPolkadotApi<TApi, TRes>, address: string, asset: TAssetInfo) {
    const isNativeAsset = isSymbolMatch(asset.symbol, this.getNativeAssetSymbol())
    if (isNativeAsset) return this.getBalanceNative(api, address, asset)
    return this.getBalanceForeign(api, address, asset)
  }
}

export default Parachain
