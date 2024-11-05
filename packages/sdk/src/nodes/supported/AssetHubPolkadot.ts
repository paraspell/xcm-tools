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
import type { Junctions, TSerializedApiCallV2, TTransferReturn } from '../../types'
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
import { getOtherAssets, getParaId } from '../../pallets/assets'
import { generateAddressMultiLocationV4 } from '../../utils/generateAddressMultiLocationV4'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { ETHEREUM_JUNCTION } from '../../const'
import { createEthereumTokenLocation } from '../../utils/multiLocation/createEthereumTokenLocation'

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
      (targetChain === 'Kusama' && input.currencySymbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Polkadot' && input.currencySymbol?.toUpperCase() === 'DOT')
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
      (targetChain === 'Polkadot' && input.currencySymbol?.toUpperCase() === 'KSM') ||
      (targetChain === 'Kusama' && input.currencySymbol?.toUpperCase() === 'DOT')
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
      `Polkadot <-> Kusama bridge does not support currency ${input.currencySymbol}`
    )
  }

  public handleEthBridgeTransfer<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>) {
    const { api, scenario, destination, paraIdTo, address, currencySymbol } = input

    if (!ethers.isAddress(address)) {
      throw new Error('Only Ethereum addresses are supported for Ethereum transfers')
    }

    const ethAssets = getOtherAssets('Ethereum')
    const ethAsset = ethAssets.find(asset => asset.symbol === currencySymbol)

    if (!ethAsset) {
      throw new InvalidCurrencyError(
        `Currency ${currencySymbol} is not supported for Ethereum transfers`
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
              AccountKey20: { key: ethAsset.assetId }
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
    const { api, address, amount, currencyId, overridedCurrency, scenario, destination, paraIdTo } =
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
        currencyId,
        overridedCurrency ?? customMultiLocation
      )
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      modifiedInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  }

  handleBifrostEthTransfer = <TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): TTransferReturn<TRes> => {
    const { api, amount, scenario, version, destination, currencyId } = input

    const versionOrDefault = version ?? this.version

    const call: TSerializedApiCallV2 = {
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
                amount,
                versionOrDefault,
                Parents.TWO,
                createEthereumTokenLocation(currencyId ?? '')
              )
            )[0][0]
          ]
        },
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: {
          [versionOrDefault]: {
            Concrete: createEthereumTokenLocation(currencyId ?? '')
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
      currencySymbol,
      currencyId,
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
      (currencySymbol?.toUpperCase() === 'USDT' || currencySymbol?.toUpperCase() === 'USDC') &&
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
          currencyId,
          overridedCurrency
        )
      }
    }

    const dotAsset = getOtherAssets(this.node).find(({ symbol }) => symbol === 'DOT')

    if (
      destination === 'Hydration' &&
      (currencySymbol === dotAsset?.symbol || currencyId === dotAsset?.assetId)
    ) {
      const versionOrDefault = version ?? this.version
      return {
        ...input,
        currencySelection: super.createCurrencySpec(
          amount,
          'ParaToRelay',
          versionOrDefault,
          currencyId,
          overridedCurrency
        )
      }
    }

    return input
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    const { scenario, currencySymbol, currencyId, destination } = input

    if (destination === 'AssetHubKusama') {
      return Promise.resolve(this.handleBridgeTransfer<TApi, TRes>(input, 'Kusama'))
    }

    if (destination === 'Ethereum') {
      return Promise.resolve(this.handleEthBridgeTransfer<TApi, TRes>(input))
    }

    if (destination === 'Mythos') {
      return Promise.resolve(this.handleMythosTransfer(input))
    }

    const wethAsset = getOtherAssets('Ethereum').find(({ symbol }) => symbol === 'WETH')

    if (
      destination === 'BifrostPolkadot' &&
      (currencySymbol === wethAsset?.symbol || currencyId === wethAsset?.assetId)
    ) {
      return Promise.resolve(this.handleBifrostEthTransfer(input))
    }

    if (
      scenario === 'ParaToPara' &&
      currencySymbol === 'DOT' &&
      currencyId === undefined &&
      destination !== 'Hydration'
    ) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Para to Para scenarios for DOT transfer from AssetHub are not supported, you have to transfer DOT to Relay chain and transfer to destination chain from Relay chain.'
      )
    }

    if (scenario === 'ParaToPara' && currencySymbol === 'KSM' && currencyId === undefined) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Bridged KSM cannot currently be transfered from AssetHubPolkadot, if you are sending different KSM asset, please specify {id: <KSMID>}.'
      )
    }

    const section =
      scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'

    const modifiedInput = this.patchInput(input)

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(modifiedInput, section, 'Unlimited')
    )
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCallV2 {
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
    currencyId?: string,
    overridedMultiLocation?: TMultiLocation | TMultiAsset[]
  ) {
    if (scenario === 'ParaToPara') {
      const interior: Junctions = {
        X2: [
          {
            PalletInstance: 50
          },
          {
            // TODO: Handle the case where currencyId is undefined
            GeneralIndex: currencyId ?? ''
          }
        ]
      }
      return createCurrencySpec(amount, version, Parents.ZERO, overridedMultiLocation, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, currencyId)
    }
  }
}

export default AssetHubPolkadot
