// Contains detailed structure of XCM call construction for Mythos Parachain

import { findAssetInfoOrThrow } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Parents, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedExtrinsics
} from '../../types'
import { createVersionedDestination } from '../../utils'
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
import Chain from '../Chain'
import { getParaId } from '../config'

export const createTypeAndThenTransfer = async <TApi, TRes, TSigner>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>,
  chain: TSubstrateChain,
  version: Version
): Promise<TSerializedExtrinsics> => {
  const { api, assetInfo: asset, senderAddress, address } = options

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

  const hopDestination: TSubstrateChain = 'AssetHubPolkadot'

  return {
    module: 'PolkadotXcm',
    method: 'transfer_assets_using_type_and_then',
    params: {
      dest: createVersionedDestination(version, chain, hopDestination, getParaId(hopDestination)),
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

class Mythos<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Mythos', 'mythos', 'Polkadot', Version.V5)
  }

  async transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { api, destination, scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    const defaultTx = await transferPolkadotXcm(input)

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

  isRelayToParaEnabled(): boolean {
    return false
  }
}

export default Mythos
