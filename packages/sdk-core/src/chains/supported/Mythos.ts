// Contains detailed structure of XCM call construction for Mythos Parachain

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
import { assertAddressIsString, assertHasId, assertSender } from '../../utils/assertions'
import { createAsset } from '../../utils/asset'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { handleToAhTeleport } from '../../utils/transfer'
import { getParaId } from '../config'
import SubstrateChain from '../SubstrateChain'

export const createTypeAndThenTransfer = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  version: Version
): Promise<TSerializedExtrinsics> => {
  const { api, assetInfo: asset, sender, recipient } = options

  const ethAsset = api.findAssetInfoOrThrow('Ethereum', { symbol: asset.symbol })

  assertHasId(ethAsset)
  assertAddressIsString(recipient)
  assertSender(sender)

  const messageId = await generateMessageId(
    api,
    sender,
    api.getParaId(chain),
    ethAsset.assetId,
    recipient,
    asset.amount
  )

  const nativeMythAmount = await getMythosOriginFee(api)

  const hopDestination: TSubstrateChain = 'AssetHubPolkadot'

  return {
    module: 'PolkadotXcm',
    method: 'transfer_assets_using_type_and_then',
    params: {
      dest: createVersionedDestination(
        api,
        version,
        chain,
        hopDestination,
        getParaId(hopDestination)
      ),
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

class Mythos<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Mythos', 'mythos', 'Polkadot', Version.V5)
  }

  async transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
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
