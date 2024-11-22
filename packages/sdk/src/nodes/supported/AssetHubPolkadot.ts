// Contains detailed structure of XCM call construction for AssetHubPolkadot Parachain

import { ethers } from 'ethers'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import {
  constructRelayToParaParameters,
  createBridgeCurrencySpec,
  createBridgePolkadotXcmDest,
  createCurrencySpec,
  createPolkadotXcmHeader
} from '../../pallets/xcmPallet/utils'
import type {
  Junctions,
  PolkadotXcmSection,
  TAsset,
  TDestination,
  TSerializedApiCall
} from '../../types'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  Parents,
  type TScenario,
  type TRelayToParaOptions,
  type TMultiAsset,
  type TMultiLocation
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { getOtherAssets } from '../../pallets/assets'
import { generateAddressMultiLocationV4 } from '../../utils/generateAddressMultiLocationV4'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { ETHEREUM_JUNCTION } from '../../const'
import { createEthereumTokenLocation } from '../../utils/multiLocation/createEthereumTokenLocation'
import { isForeignAsset } from '../../utils/assets'
import { getParaId } from '../config'

const createCustomXcmToBifrost = <TApi, TRes>(
  { api, address, scenario }: PolkadotXCMTransferInput<TApi, TRes>,
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
    input: PolkadotXCMTransferInput<TApi, TRes>,
    targetChain: 'Polkadot' | 'Kusama'
  ) {
    if (
      (targetChain === 'Kusama' && input.asset.symbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Polkadot' && input.asset.symbol?.toUpperCase() === 'DOT')
    ) {
      const modifiedInput: PolkadotXCMTransferInput<TApi, TRes> = {
        ...input,
        header: createBridgePolkadotXcmDest(
          Version.V4,
          targetChain,
          input.destination,
          input.paraIdTo
        ),
        addressSelection: generateAddressMultiLocationV4(input.api, input.address),
        currencySelection: createBridgeCurrencySpec(input.amount, targetChain)
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
      const modifiedInput: PolkadotXCMTransferInput<TApi, TRes> = {
        ...input,
        header: createBridgePolkadotXcmDest(
          Version.V3,
          targetChain,
          input.destination,
          input.paraIdTo
        ),
        currencySelection: createCurrencySpec(
          input.amount,
          Version.V3,
          Parents.ONE,
          input.overridedCurrency
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

  public handleEthBridgeTransfer<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>) {
    const { api, scenario, destination, paraIdTo, address, asset } = input

    if (!ethers.isAddress(address)) {
      throw new Error('Only Ethereum addresses are supported for Ethereum transfers')
    }

    const ethAssets = getOtherAssets('Ethereum')
    const ethAsset = ethAssets.find(asset => asset.symbol === asset.symbol)

    if (!ethAsset) {
      throw new InvalidCurrencyError(
        `Currency ${asset.symbol} is not supported for Ethereum transfers`
      )
    }

    const modifiedInput: PolkadotXCMTransferInput<TApi, TRes> = {
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
      currencySelection: createCurrencySpec(input.amount, Version.V3, Parents.TWO, {
        parents: Parents.TWO,
        interior: {
          X2: [
            ETHEREUM_JUNCTION,
            {
              AccountKey20: { key: ethAsset.assetId ?? '' }
            }
          ]
        }
      })
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      modifiedInput,
      'transfer_assets',
      'Unlimited'
    )
  }

  handleMythosTransfer<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>) {
    const { api, address, amount, asset, overridedCurrency, scenario, destination, paraIdTo } =
      input
    const version = Version.V2
    const paraId =
      destination !== undefined && typeof destination !== 'object' && destination !== 'Ethereum'
        ? (paraIdTo ?? getParaId(destination))
        : undefined
    const customMultiLocation: TMultiLocation = {
      parents: Parents.ONE,
      interior: {
        X1: {
          Parachain: paraId
        }
      }
    }
    const modifiedInput: PolkadotXCMTransferInput<TApi, TRes> = {
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
        amount,
        scenario,
        version,
        asset,
        overridedCurrency ?? customMultiLocation
      )
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      modifiedInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  }

  handleBifrostEthTransfer = <TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): TRes => {
    const { api, amount, scenario, version, destination, asset } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    const versionOrDefault = version ?? this.version

    const ethereumTokenLocation = createEthereumTokenLocation(asset.assetId ?? '')

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
              createCurrencySpec(amount, versionOrDefault, Parents.TWO, ethereumTokenLocation)
            )[0][0]
          ]
        },
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: {
          [versionOrDefault]: {
            Concrete: ethereumTokenLocation
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
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): PolkadotXCMTransferInput<TApi, TRes> {
    const {
      asset,
      destination,
      paraIdTo,
      amount,
      overridedCurrency,
      scenario,
      api,
      version,
      address
    } = input

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
          amount,
          scenario,
          versionOrDefault,
          asset,
          overridedCurrency
        )
      }
    }

    if ((destination === 'Hydration' || destination === 'Polimec') && asset.symbol === 'DOT') {
      const versionOrDefault = version ?? this.version
      return {
        ...input,
        currencySelection: super.createCurrencySpec(
          amount,
          'ParaToRelay',
          versionOrDefault,
          asset,
          overridedCurrency
        )
      }
    }

    return input
  }

  private getSection(scenario: TScenario, destination?: TDestination): PolkadotXcmSection {
    if (destination === 'Polimec') return 'transfer_assets'
    return scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
  }

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): Promise<TRes> {
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
      destination !== 'Polimec'
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

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    asset?: TAsset,
    overridedMultiLocation?: TMultiLocation | TMultiAsset[]
  ) {
    if (scenario === 'ParaToPara') {
      const interior: Junctions = {
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
