// Contains detailed structure of XCM call construction for Mythos Parachain

import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Parents, replaceBigInt, Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createVersionedDestination } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedExtrinsics
} from '../../types'
import { assertAddressIsString, assertHasLocation, assertSenderAddress } from '../../utils'
import { createAsset } from '../../utils/asset'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { handleToAhTeleport } from '../../utils/transfer'
import { getParaId } from '../config'
import Parachain from '../Parachain'

export const createTypeAndThenTransfer = async <TApi, TRes>(
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  chain: TSubstrateChain,
  version: Version
): Promise<TSerializedExtrinsics> => {
  const { api, assetInfo: asset, senderAddress, address, destination } = options

  assertHasLocation(asset)
  assertAddressIsString(address)
  assertSenderAddress(senderAddress)

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

  const nativeMythAmount = await getMythosOriginFee(api)

  return {
    module: 'PolkadotXcm',
    method: 'transfer_assets_using_type_and_then',
    params: {
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
      return api.deserializeExtrinsics(
        await createTypeAndThenTransfer(input, this.chain, this.version)
      )
    }

    return defaultTx
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }
}

export default Mythos
