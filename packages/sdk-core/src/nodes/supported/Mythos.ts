// Contains detailed structure of XCM call construction for Mythos Parachain

import { getNativeAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { Parents, replaceBigInt, Version } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import {
  InvalidParameterError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createVersionedDestination } from '../../pallets/xcmPallet/utils'
import { getParaEthTransferFees } from '../../transfer'
import { padFeeBy } from '../../transfer/fees/padFee'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedApiCall
} from '../../types'
import { assertAddressIsString, assertHasLocation } from '../../utils'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createMultiAsset } from '../../utils/multiAsset'
import { handleToAhTeleport } from '../../utils/transfer'
import { getParaId } from '../config'
import ParachainNode from '../ParachainNode'

export const createTypeAndThenTransfer = async <TApi, TRes>(
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  node: TNodeDotKsmWithRelayChains,
  version: Version
): Promise<TSerializedApiCall> => {
  const { api, asset, senderAddress, address, destination } = options

  assertHasLocation(asset)
  assertAddressIsString(address)

  if (!senderAddress) {
    throw new InvalidCurrencyError(`Sender address is required for Mythos transfer`)
  }

  if (!isForeignAsset(asset) || !asset.assetId) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(asset, replaceBigInt)} is not a foreign asset`
    )
  }

  const messageId = await generateMessageId(
    api,
    senderAddress,
    getParaId(node),
    asset.assetId,
    address,
    asset.amount
  )

  const ahApi = api.clone()
  await ahApi.init('AssetHubPolkadot')

  const [bridgeFee, ahExecutionFee] = await getParaEthTransferFees(ahApi)

  const feeConverted = await ahApi.quoteAhPrice(
    DOT_MULTILOCATION,
    getNativeAssets(node)[0].multiLocation as TMultiLocation,
    bridgeFee + ahExecutionFee
  )

  if (!feeConverted) {
    throw new InvalidParameterError(`Pool DOT -> ${asset.symbol} not found.`)
  }

  const nativeMythAmount = padFeeBy(feeConverted, 10)

  return {
    module: 'PolkadotXcm',
    method: 'transfer_assets_using_type_and_then',
    parameters: {
      dest: createVersionedDestination(version, node, destination, getParaId('AssetHubPolkadot')),
      assets: {
        [version]: [
          createMultiAsset(version, nativeMythAmount, {
            parents: Parents.ZERO,
            interior: 'Here'
          }),
          createMultiAsset(version, asset.amount, asset.multiLocation)
        ]
      },
      assets_transfer_type: 'DestinationReserve',
      remote_fees_id: {
        [version]: {
          parents: Parents.ZERO,
          interior: 'Here'
        }
      },
      fees_transfer_type: 'Teleport',
      custom_xcm_on_dest: createCustomXcmOnDest(options, node, messageId),
      weight_limit: 'Unlimited'
    }
  }
}

class Mythos<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Mythos', 'mythos', 'polkadot', Version.V4)
  }

  private createTx<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, asset, destination } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const nativeSymbol = this.getNativeAssetSymbol()
    if (asset.symbol !== nativeSymbol) {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${asset.symbol}`)
    }

    return transferPolkadotXcm(
      input,
      destination === 'AssetHubPolkadot'
        ? 'limited_teleport_assets'
        : 'limited_reserve_transfer_assets',
      'Unlimited'
    )
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, destination } = input

    const defaultTx = await this.createTx(input)

    if (destination === 'AssetHubPolkadot') {
      return handleToAhTeleport('Mythos', input, defaultTx)
    }

    if (destination == 'Ethereum') {
      return api.callTxMethod(await createTypeAndThenTransfer(input, this.node, this.version))
    }

    return defaultTx
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Mythos
