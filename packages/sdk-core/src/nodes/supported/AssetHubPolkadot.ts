// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import { ethers } from 'ethers'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import {
  createBridgeCurrencySpec,
  createBridgePolkadotXcmDest,
  createCurrencySpec,
  createPolkadotXcmHeader
} from '../../pallets/xcmPallet/utils'
import type {
  TJunctions,
  TPolkadotXcmSection,
  TAsset,
  TDestination,
  TSerializedApiCall,
  TRelayToParaOverrides,
  TAmount
} from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  Version,
  Parents,
  type TScenario,
  type TMultiAsset,
  type TMultiLocation
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { getOtherAssets } from '../../pallets/assets'
import { generateAddressMultiLocationV4 } from '../../utils/generateAddressMultiLocationV4'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { ETHEREUM_JUNCTION } from '../../constants'
import { isForeignAsset } from '../../utils/assets'
import { getParaId } from '../config'
import { resolveParaId } from '../../utils/resolveParaId'

const createCustomXcmToBifrost = <TApi, TRes>(
  { api, address, scenario }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: 'All' },
        beneficiary: Object.values(
          generateAddressPayload(api, scenario, 'PolkadotXcm', address, version, undefined)
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
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        header: createBridgePolkadotXcmDest(
          Version.V4,
          targetChain,
          input.destination,
          input.paraIdTo
        ),
        addressSelection: generateAddressMultiLocationV4(input.api, input.address),
        currencySelection: createBridgeCurrencySpec(input.asset.amount, targetChain)
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
      const modifiedInput: TPolkadotXCMTransferOptions<TApi, TRes> = {
        ...input,
        header: createBridgePolkadotXcmDest(
          Version.V3,
          targetChain,
          input.destination,
          input.paraIdTo
        ),
        currencySelection: createCurrencySpec(
          input.asset.amount,
          Version.V3,
          Parents.ONE,
          input.overriddenAsset
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
      currencySelection: createCurrencySpec(
        input.asset.amount,
        Version.V3,
        Parents.TWO,
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
    const { api, address, asset, overriddenAsset, scenario, destination, paraIdTo } = input
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
      currencySelection: this.createCurrencySpec(
        asset.amount,
        scenario,
        version,
        asset,
        overriddenAsset ?? customMultiLocation
      )
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      modifiedInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  }

  handleBifrostEthTransfer = <TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): TRes => {
    const { api, scenario, version, destination, asset } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)
    }

    const versionOrDefault = version ?? this.version

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      section: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: this.createPolkadotXcmHeader(
          scenario,
          versionOrDefault,
          destination,
          getParaId('BifrostPolkadot')
        ),
        assets: {
          [versionOrDefault]: [
            Object.values(
              createCurrencySpec(
                asset.amount,
                versionOrDefault,
                Parents.TWO,
                asset.multiLocation as TMultiLocation
              )
            )[0][0]
          ]
        },
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: {
          [versionOrDefault]: {
            Concrete: asset.multiLocation
          }
        },
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: createCustomXcmToBifrost(input, versionOrDefault),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }

  patchInput<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): TPolkadotXCMTransferOptions<TApi, TRes> {
    const { asset, destination, paraIdTo, overriddenAsset, scenario, api, version, address } = input

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
        currencySelection: this.createCurrencySpec(
          asset.amount,
          scenario,
          versionOrDefault,
          asset,
          overriddenAsset
        )
      }
    }

    if (
      (destination === 'Hydration' ||
        destination === 'Polimec' ||
        destination === 'Moonbeam' ||
        destination === 'BifrostPolkadot') &&
      asset.symbol === 'DOT'
    ) {
      const versionOrDefault = version ?? this.version
      return {
        ...input,
        currencySelection: super.createCurrencySpec(
          asset.amount,
          'ParaToRelay',
          versionOrDefault,
          asset,
          overriddenAsset
        )
      }
    }

    return input
  }

  private getSection(scenario: TScenario, destination: TDestination): TPolkadotXcmSection {
    if (destination === 'Polimec' || destination === 'Moonbeam') return 'transfer_assets'
    return scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, asset, destination } = input

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

    if (
      scenario === 'ParaToPara' &&
      asset.symbol === 'DOT' &&
      !isForeignAsset(asset) &&
      destination !== 'Hydration' &&
      destination !== 'Polimec' &&
      destination !== 'Moonbeam' &&
      destination !== 'BifrostPolkadot'
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

  createCurrencySpec(
    amount: TAmount,
    scenario: TScenario,
    version: Version,
    asset?: TAsset,
    overridedMultiLocation?: TMultiLocation | TMultiAsset[]
  ) {
    if (scenario === 'ParaToPara') {
      const interior: TJunctions = {
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
      const multiLocation =
        overridedMultiLocation !== undefined
          ? overridedMultiLocation
          : asset && isForeignAsset(asset)
            ? (asset.multiLocation as TMultiLocation)
            : undefined
      return createCurrencySpec(amount, version, Parents.ZERO, multiLocation, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, asset)
    }
  }
}

export default AssetHubPolkadot
