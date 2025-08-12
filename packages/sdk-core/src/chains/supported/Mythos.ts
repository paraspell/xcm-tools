// Contains detailed structure of XCM call construction for Mythos Parachain

import { getNativeAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { Parents, replaceBigInt, Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import {
  ChainNotSupportedError,
  InvalidParameterError,
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
import { createAsset } from '../../utils/asset'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { handleToAhTeleport } from '../../utils/transfer'
import { getParaId } from '../config'
import Parachain from '../Parachain'

export const createTypeAndThenTransfer = async <TApi, TRes>(
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  chain: TSubstrateChain,
  version: Version
): Promise<TSerializedApiCall> => {
  const { api, assetInfo: asset, senderAddress, address, destination } = options

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
    getParaId(chain),
    asset.assetId,
    address,
    asset.amount
  )

  const ahApi = api.clone()
  await ahApi.init('AssetHubPolkadot')

  const [bridgeFee, ahExecutionFee] = await getParaEthTransferFees(ahApi)

  const feeConverted = await ahApi.quoteAhPrice(
    DOT_LOCATION,
    getNativeAssets(chain)[0].location as TLocation,
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
      dest: createVersionedDestination(version, chain, destination, getParaId('AssetHubPolkadot')),
      assets: {
        [version]: [
          createAsset(version, nativeMythAmount, {
            parents: Parents.ZERO,
            interior: 'Here'
          }),
          createAsset(version, asset.amount, asset.location)
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
      custom_xcm_on_dest: createCustomXcmOnDest(options, chain, messageId),
      weight_limit: 'Unlimited'
    }
  }
}

class Mythos<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Mythos', 'mythos', 'Polkadot', Version.V5)
  }

  private createTx<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, assetInfo: asset, destination } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    const nativeSymbol = this.getNativeAssetSymbol()
    if (asset.symbol !== nativeSymbol) {
      throw new InvalidCurrencyError(
        `Chain ${this.chain} does not support currency ${asset.symbol}`
      )
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
      return api.callTxMethod(await createTypeAndThenTransfer(input, this.chain, this.version))
    }

    return defaultTx
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new ChainNotSupportedError()
  }
}

export default Mythos
