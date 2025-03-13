// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import { ethers } from 'ethers'

import { DOT_MULTILOCATION, ETHEREUM_JUNCTION, SYSTEM_NODES_POLKADOT } from '../../constants'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import { getOtherAssets } from '../../pallets/assets'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import {
  createBridgePolkadotXcmDest,
  createMultiAsset,
  createPolkadotXcmHeader,
  createVersionedMultiAssets,
  isTMultiLocation
} from '../../pallets/xcmPallet/utils'
import type {
  TAmount,
  TAsset,
  TDestination,
  TPolkadotXcmSection,
  TRelayToParaOverrides,
  TSerializedApiCall
} from '../../types'
import {
  type IPolkadotXCMTransfer,
  Parents,
  type TMultiLocation,
  type TPolkadotXCMTransferOptions,
  type TScenario,
  Version
} from '../../types'
import { isAssetEqual, isForeignAsset } from '../../utils/assets'
import { createExecuteXcm } from '../../utils/createExecuteXcm'
import { generateAddressMultiLocationV4 } from '../../utils/generateAddressMultiLocationV4'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { transformMultiLocation } from '../../utils/multiLocation'
import { resolveParaId } from '../../utils/resolveParaId'
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
        beneficiary: (
          Object.values(
            generateAddressPayload(api, scenario, 'PolkadotXcm', address, version, undefined)
          ) as TMultiLocation[]
        )[0]
      }
    }
  ]
})

class AssetHubPolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor() {
    super('AssetHubPolkadot', 'PolkadotAssetHub', 'polkadot', Version.V3)
  }

  public handleBridgeTransfer<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>,
    targetChain: 'Polkadot' | 'Kusama'
  ) {
    if (
      (targetChain === 'Kusama' && input.asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Polkadot' && input.asset.symbol?.toUpperCase() === 'DOT')
    ) {
      const overriddenVersion = Version.V4
      const customMultiLocation: TMultiLocation = {
        parents: Parents.TWO,
        interior: {
          X1: [
            {
              GlobalConsensus: targetChain
            }
          ]
        }
      }
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        header: createBridgePolkadotXcmDest(
          overriddenVersion,
          targetChain,
          input.destination,
          input.paraIdTo
        ),
        addressSelection: generateAddressMultiLocationV4(input.api, input.address),
        currencySelection: createVersionedMultiAssets(
          overriddenVersion,
          input.asset.amount,
          customMultiLocation
        )
      }
      return PolkadotXCMTransferImpl.transferPolkadotXCM(
        modifiedInput,
        'transfer_assets',
        'Unlimited'
      )
    } else if (
      (targetChain === 'Polkadot' && input.asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Kusama' && input.asset.symbol?.toUpperCase() === 'DOT')
    ) {
      const overriddenVersion = Version.V3
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        header: createBridgePolkadotXcmDest(
          overriddenVersion,
          targetChain,
          input.destination,
          input.paraIdTo
        ),
        currencySelection: createVersionedMultiAssets(
          overriddenVersion,
          input.asset.amount,
          DOT_MULTILOCATION
        )
      }
      return PolkadotXCMTransferImpl.transferPolkadotXCM(
        modifiedInput,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    }
    throw new InvalidCurrencyError(
      `Polkadot <-> Kusama bridge does not support currency ${input.asset.symbol}`
    )
  }

  public handleEthBridgeTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, scenario, destination, paraIdTo, address, asset } = input

    if (!ethers.isAddress(address)) {
      throw new Error('Only Ethereum addresses are supported for Ethereum transfers')
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
    }

    const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
      ...input,
      header: createPolkadotXcmHeader(
        scenario,
        this.version,
        destination,
        paraIdTo,
        ETHEREUM_JUNCTION,
        Parents.TWO
      ),
      addressSelection: generateAddressPayload(
        api,
        scenario,
        'PolkadotXcm',
        address,
        this.version,
        paraIdTo
      ),
      currencySelection: createVersionedMultiAssets(
        Version.V3,
        asset.amount,
        asset.multiLocation as TMultiLocation
      )
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      modifiedInput,
      'transfer_assets',
      'Unlimited'
    )
  }

  handleMythosTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, address, asset, scenario, destination, paraIdTo } = input
    const version = Version.V2
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
      header: this.createPolkadotXcmHeader(scenario, version, destination, paraId),
      addressSelection: generateAddressPayload(
        api,
        scenario,
        'PolkadotXcm',
        address,
        version,
        paraId
      ),
      currencySelection: createVersionedMultiAssets(version, asset.amount, customMultiLocation)
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      modifiedInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  }

  handleBifrostEthTransfer = <TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): TRes => {
    const { api, scenario, version = this.version, destination, asset } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
    }

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      section: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createPolkadotXcmHeader(
          scenario,
          version,
          destination,
          getParaId('BifrostPolkadot')
        ),
        assets: {
          [version]: [
            createMultiAsset(version, asset.amount, asset.multiLocation as TMultiLocation)
          ]
        },
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: {
          [version]: {
            Concrete: asset.multiLocation
          }
        },
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
    const { asset, destination, paraIdTo, scenario, api, version = this.version, address } = input

    if (
      (asset.symbol?.toUpperCase() === 'USDT' || asset.symbol?.toUpperCase() === 'USDC') &&
      destination === 'BifrostPolkadot'
    ) {
      const versionOrDefault = input.version ?? Version.V2
      return {
        ...input,
        header: this.createPolkadotXcmHeader(scenario, versionOrDefault, destination, paraIdTo),
        addressSelection: generateAddressPayload(
          api,
          scenario,
          'PolkadotXcm',
          address,
          versionOrDefault,
          paraIdTo
        ),
        currencySelection: this.createCurrencySpec(asset.amount, scenario, versionOrDefault, asset)
      }
    }

    if (
      (destination === 'Hydration' ||
        destination === 'Polimec' ||
        destination === 'Moonbeam' ||
        destination === 'BifrostPolkadot') &&
      asset.symbol === 'DOT'
    ) {
      return {
        ...input,
        currencySelection: createVersionedMultiAssets(version, asset.amount, DOT_MULTILOCATION)
      }
    }

    return input
  }

  private getSection(scenario: TScenario, destination: TDestination): TPolkadotXcmSection {
    const isSystemNode =
      !isTMultiLocation(destination) && SYSTEM_NODES_POLKADOT.includes(destination)
    if (destination === 'Polimec' || destination === 'Moonbeam') return 'transfer_assets'
    return scenario === 'ParaToPara' && !isSystemNode
      ? 'limited_reserve_transfer_assets'
      : 'limited_teleport_assets'
  }

  private async handleExecuteTransfer<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) {
    const { api, senderAddress, asset } = input

    if (!senderAddress) {
      throw new Error('Please provide senderAddress')
    }

    validateAddress(senderAddress, this.node, false)

    const MIN_FEE = 150000n
    const maxU64 = (1n << 64n) - 1n
    const dummyTx = createExecuteXcm(input, { refTime: maxU64, proofSize: maxU64 }, MIN_FEE)

    const dryRunResult = await api.getDryRun({
      node: this.node,
      tx: dummyTx,
      address: senderAddress
    })

    if (!dryRunResult.success) {
      throw new Error(`Dry run failed: ${dryRunResult.failureReason}`)
    }

    if (!dryRunResult.weight) {
      throw new Error('Dry run failed: weight not found')
    }

    const feeDotShifted = dryRunResult.fee / 10n

    const toMl = transformMultiLocation(asset.multiLocation as TMultiLocation)
    const feeConverted = await api.quoteAhPrice(DOT_MULTILOCATION, toMl, feeDotShifted)

    if (!feeConverted) {
      throw new Error(`Pool DOT -> ${asset.symbol} not found.`)
    }

    if (BigInt(asset.amount) - feeConverted < 0) {
      throw new Error(`Insufficient balance. Fee: ${feeConverted}, Amount: ${asset.amount}`)
    }

    const feeConvertedPadded = (feeConverted * 3n) / 2n // increases fee by 50%

    return createExecuteXcm(input, dryRunResult.weight, feeConvertedPadded)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, asset, destination, feeAsset, overriddenAsset } = input

    if (feeAsset) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden multi-assets with XCM execute')
      }

      if (!isAssetEqual(feeAsset, asset)) {
        throw new InvalidCurrencyError(`Fee asset does not match transfer asset.`)
      }

      return Promise.resolve(this.handleExecuteTransfer(input))
    }

    if (destination === 'AssetHubKusama') {
      return Promise.resolve(this.handleBridgeTransfer<TApi, TRes>(input, 'Kusama'))
    }

    if (destination === 'Ethereum') {
      return Promise.resolve(this.handleEthBridgeTransfer<TApi, TRes>(input))
    }

    if (destination === 'Mythos') {
      return Promise.resolve(this.handleMythosTransfer(input))
    }

    const ethereumAssets = getOtherAssets('Ethereum')
    const isEthereumAsset = ethereumAssets.some(
      ({ symbol, assetId }) =>
        asset.symbol === symbol && isForeignAsset(asset) && asset.assetId === assetId
    )

    if (destination === 'BifrostPolkadot' && isEthereumAsset) {
      return Promise.resolve(this.handleBifrostEthTransfer(input))
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
      !isSystemNode
    ) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Para to Para scenarios for DOT transfer from AssetHub are not supported, you have to transfer DOT to Relay chain and transfer to destination chain from Relay chain.'
      )
    }

    if (scenario === 'ParaToPara' && asset.symbol === 'KSM' && !isForeignAsset(asset)) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Bridged KSM cannot currently be transfered from AssetHubPolkadot, if you are sending different KSM asset, please specify {id: <KSMID>}.'
      )
    }

    const section = this.getSection(scenario, destination)

    const modifiedInput = this.patchInput(input)

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(modifiedInput, section, 'Unlimited')
    )
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_teleport_assets', includeFee: true }
  }

  createCurrencySpec(amount: TAmount, scenario: TScenario, version: Version, asset?: TAsset) {
    if (scenario === 'ParaToPara') {
      const multiLocation = asset ? (asset.multiLocation as TMultiLocation) : undefined

      return createVersionedMultiAssets(
        version,
        amount,
        multiLocation ?? {
          parents: Parents.ZERO,
          interior: {
            X2: [
              {
                PalletInstance: 50
              },
              {
                // TODO: Handle missing assedId
                GeneralIndex: asset && isForeignAsset(asset) && asset.assetId ? asset.assetId : 0
              }
            ]
          }
        }
      )
    } else {
      return super.createCurrencySpec(amount, scenario, version, asset)
    }
  }
}

export default AssetHubPolkadot
