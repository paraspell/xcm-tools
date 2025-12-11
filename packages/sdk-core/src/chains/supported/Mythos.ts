// Contains detailed structure of XCM call construction for Mythos Parachain

import { findAssetInfoOrThrow } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Parents, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createVersionedDestination } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedExtrinsics
} from '../../types'
import {
  assertAddressIsString,
  assertHasId,
  assertHasLocation,
  assertSenderAddress
} from '../../utils/assertions'
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

  const ethAsset = findAssetInfoOrThrow('Ethereum', { symbol: asset.symbol }, null)

  assertHasLocation(ethAsset)
  assertHasId(ethAsset)
  assertAddressIsString(address)
  assertSenderAddress(senderAddress)

  const messageId = await generateMessageId(
    api,
    senderAddress,
    getParaId(chain),
    ethAsset.assetId,
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
          createAsset(version, asset.amount, ethAsset.location)
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
      custom_xcm_on_dest: createCustomXcmOnDest(options, chain, messageId, ethAsset),
      weight_limit: 'Unlimited'
    }
  }
}

class Mythos<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Mythos', 'mythos', 'Polkadot', Version.V5)
  }

  private createTx<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, destination } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
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
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: 'RelayToPara' })
  }
}

export default Mythos
