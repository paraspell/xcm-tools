// Contains selection of compatible XCM pallet for each compatible Parachain and create transfer function

import {
  findAssetByMultiLocation,
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  isNodeEvm,
  Native,
  type TAsset,
  type TMultiAsset
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { Version } from '@paraspell/sdk-common'
import {
  isTMultiLocation,
  Parents,
  replaceBigInt,
  type TEcosystemType,
  type TNodePolkadotKusama
} from '@paraspell/sdk-common'

import { Builder } from '../builder'
import { ASSET_HUB_EXECUTION_FEE, DOT_MULTILOCATION } from '../constants'
import {
  BridgeHaltedError,
  DryRunFailedError,
  InvalidAddressError,
  InvalidParameterError
} from '../errors'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import {
  constructRelayToParaParameters,
  createDestination,
  createVersionedDestination
} from '../pallets/xcmPallet/utils'
import { transferXTokens } from '../pallets/xTokens'
import { getParaEthTransferFees } from '../transfer'
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
  assertHasId,
  assertHasLocation,
  createBeneficiaryLocation
} from '../utils'
import { createCustomXcmOnDest } from '../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../utils/ethereum/generateMessageId'
import { createMultiAsset } from '../utils/multiAsset'
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

abstract class ParachainNode<TApi, TRes> {
  private readonly _node: TNodePolkadotKusama

  // Property _info maps our node names to names which polkadot libs are using
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayKusama.ts
  // https://github.com/polkadot-js/apps/blob/master/packages/apps-config/src/endpoints/productionRelayPolkadot.ts
  // These names can be found under object key 'info'
  private readonly _info: string

  private readonly _type: TEcosystemType

  private readonly _version: Version

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

  protected canUseXTokens({ asset }: TSendInternalOptions<TApi, TRes>): boolean {
    const isEthAsset =
      asset.multiLocation &&
      findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)
    return !isEthAsset
  }

  async transfer(options: TSendInternalOptions<TApi, TRes>): Promise<TRes> {
    const {
      api,
      asset,
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
    } = options
    const scenario = resolveScenario(this.node, destination)
    const paraId = resolveParaId(paraIdTo, destination)

    if (
      destination === 'Polimec' &&
      this.node !== 'AssetHubPolkadot' &&
      this.node !== 'Hydration' &&
      this.node !== destination
    ) {
      throw new InvalidParameterError(
        'Sending assets to Polimec is supported only from AssetHubPolkadot and Hydration'
      )
    }

    const isLocalTransfer = this.node === destination
    if (isLocalTransfer) {
      return this.transferLocal(options)
    }

    if (supportsXTokens(this) && this.canUseXTokens(options)) {
      const isBifrostOrigin = this.node === 'BifrostPolkadot' || this.node === 'BifrostKusama'
      const isJamtonOrigin = this.node === 'Jamton'
      const isAssetHubDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
      const shouldUseMultiasset = isAssetHubDest && !isBifrostOrigin && !isJamtonOrigin

      const input: TXTokensTransferOptions<TApi, TRes> = {
        api,
        asset,
        address,
        origin: this.node,
        scenario,
        paraIdTo: paraId,
        version,
        destination,
        overriddenAsset,
        pallet,
        method
      }

      if (shouldUseMultiasset) {
        return transferXTokens(input, undefined)
      }

      return this.transferXTokens(input)
    } else if (supportsXTransfer(this)) {
      return this.transferXTransfer({
        api,
        asset,
        recipientAddress: address,
        paraIdTo: paraId,
        origin: this.node,
        destination,
        overriddenAsset,
        pallet,
        method
      })
    } else if (supportsPolkadotXCM(this)) {
      const options: TPolkadotXCMTransferOptions<TApi, TRes> = {
        api,
        destLocation: createDestination(version, this.node, destination, paraId),
        beneficiaryLocation: createBeneficiaryLocation({
          api,
          address: address,
          version
        }),
        address,
        multiAsset: this.createCurrencySpec(
          asset.amount,
          scenario,
          version,
          asset,
          overriddenAsset !== undefined
        ),
        overriddenAsset,
        asset,
        currency,
        feeAsset,
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

      // Handle common cases
      const isEthAsset =
        asset.multiLocation &&
        findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)

      const isAHPOrigin = this.node === 'AssetHubPolkadot' || this.node === 'AssetHubKusama'
      const isAHPDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
      const isEthDest = destination === 'Ethereum'

      // Eth asset - Any origin to any dest via AH - DestinationReserve - multiple instructions
      if (isEthAsset && !isAHPOrigin && !isAHPDest && !isEthDest && !feeAsset) {
        return this.transferEthAssetViaAH(options)
      }

      // Eth asset - Any origin to AHP - DestinationReserve - one DepositAsset instruction
      if (isEthAsset && isAHPDest && !isAHPOrigin && !isEthDest && !feeAsset) {
        return this.transferToEthereum(options, true)
      }

      return this.transferPolkadotXCM(options)
    } else {
      throw new NoXCMSupportImplementedError(this._node)
    }
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
    _asset?: TAsset,
    _isOverridenAsset?: boolean
  ): TMultiAsset {
    return createMultiAsset(version, amount, {
      parents: scenario === 'ParaToRelay' ? Parents.ONE : Parents.ZERO,
      interior: 'Here'
    })
  }

  getNativeAssetSymbol(): string {
    return getNativeAssetSymbol(this.node)
  }

  transferLocal(options: TSendInternalOptions<TApi, TRes>): TRes {
    const { asset, address } = options

    if (isTMultiLocation(address)) {
      throw new InvalidAddressError('Multi-Location address is not supported for local transfers')
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
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Balances',
      method: 'transfer_keep_alive',
      parameters: {
        dest: isNodeEvm(this.node) ? address : { Id: address },
        value: asset.amount
      }
    })
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

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

  protected async transferEthAssetViaAH<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, asset, version, destination, address, senderAddress, feeAsset, paraIdTo } = input

    assertHasLocation(asset)

    if (senderAddress === undefined) {
      throw new InvalidParameterError('Sender address is required for transfers to Ethereum')
    }

    if (isTMultiLocation(address)) {
      throw new InvalidParameterError(
        'Multi-location address is not supported for Ethereum transfers'
      )
    }

    const ethMultiAsset = createMultiAsset(version, asset.amount, asset.multiLocation)

    const PARA_TO_PARA_FEE_DOT = 500000000n // 0.5 DOT

    // Pad by 25%
    const AH_EXECUTION_FEE_PADDED = (ASSET_HUB_EXECUTION_FEE * 125n) / 100n

    // Perform a dry run AH -> dest to calculate the BuyExecution amount
    const dryRunResult = await Builder(api.clone())
      .from('AssetHubPolkadot')
      .to(destination)
      .currency({
        symbol: Native('DOT'),
        amount: AH_EXECUTION_FEE_PADDED
      })
      .address(address)
      .senderAddress(senderAddress)
      .dryRun()

    if (!dryRunResult.origin.success) {
      throw new DryRunFailedError(dryRunResult.origin.failureReason)
    }

    // Pad fee by 50%
    const dryRunFeePadded = (BigInt(dryRunResult.origin.fee) * 3n) / 2n

    const dest = createDestination(version, this.node, destination, paraIdTo)

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          version,
          this.node,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: addXcmVersionHeader(
          [
            ...(!feeAsset
              ? [createMultiAsset(version, PARA_TO_PARA_FEE_DOT, DOT_MULTILOCATION)]
              : []),
            ethMultiAsset
          ],
          version
        ),

        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: addXcmVersionHeader(feeAsset?.multiLocation ?? DOT_MULTILOCATION, version),
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: addXcmVersionHeader(
          [
            {
              SetAppendix: [
                {
                  DepositAsset: {
                    assets: { Wild: 'All' },
                    beneficiary: createBeneficiaryLocation({
                      api,
                      address: senderAddress,
                      version
                    })
                  }
                }
              ]
            },
            {
              DepositReserveAsset: {
                assets: {
                  Wild: 'All'
                },
                dest,
                xcm: [
                  {
                    BuyExecution: {
                      fees: {
                        id: DOT_MULTILOCATION,
                        fun: { Fungible: dryRunFeePadded }
                      },
                      weight_limit: 'Unlimited'
                    }
                  },
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
              }
            }
          ],
          version
        ),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }

  protected async transferToEthereum<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    useOnlyDepositInstruction = false
  ): Promise<TRes> {
    const { api, asset, version, destination, address, senderAddress, feeAsset } = input

    const bridgeStatus = await getBridgeStatus(api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }

    assertHasLocation(asset)

    if (senderAddress === undefined) {
      throw new InvalidParameterError('Sender address is required for transfers to Ethereum')
    }

    if (isTMultiLocation(address)) {
      throw new InvalidParameterError(
        'Multi-location address is not supported for Ethereum transfers'
      )
    }

    const ethMultiAsset = createMultiAsset(version, asset.amount, asset.multiLocation)

    const ahApi = await api.createApiForNode('AssetHubPolkadot')

    const [bridgeFee, executionFee] = await getParaEthTransferFees(ahApi)

    const PARA_TO_PARA_FEE_DOT = 500000000n // 0.5 DOT

    const fee = useOnlyDepositInstruction ? PARA_TO_PARA_FEE_DOT : bridgeFee + executionFee

    const ethAsset = findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)

    if (!ethAsset) {
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
      assertHasId(ethAsset)

      const messageId = await generateMessageId(
        api,
        senderAddress,
        getParaId(this.node),
        ethAsset.assetId,
        address,
        asset.amount
      )

      customXcmOnDest = createCustomXcmOnDest(input, this.node, messageId)
    }

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          version,
          this.node,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: addXcmVersionHeader(
          [
            ...(!feeAsset ? [createMultiAsset(version, fee, DOT_MULTILOCATION)] : []),
            ethMultiAsset
          ],
          version
        ),

        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: addXcmVersionHeader(feeAsset?.multiLocation ?? DOT_MULTILOCATION, version),
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: customXcmOnDest,
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }
}

export default ParachainNode
