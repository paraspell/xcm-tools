import { hasDryRunSupport } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { TPolkadotXCMTransferOptions, TSerializedExtrinsics } from '../../types'
import {
  assertAddressIsString,
  assertSenderAddress,
  assertToIsString
} from '../../utils/assertions'
import { getRelayChainOf } from '../../utils/chain/getRelayChainOf'
import { dryRunInternal } from '../dry-run/dryRunInternal'
import { createTypeAndThenCall } from './createTypeAndThenCall'

const createCallForReserve = async <TApi, TRes>(
  chain: TSubstrateChain,
  reserveChain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<{ call: TSerializedExtrinsics; success: boolean }> => {
  const { api, destination, address, senderAddress, currency, feeCurrency } = options

  const serialized = await createTypeAndThenCall(chain, options, reserveChain)

  assertAddressIsString(address)
  assertToIsString(destination, 'Location destination is not supported for reserve auto-selection.')
  assertSenderAddress(senderAddress)

  const tx = api.deserializeExtrinsics(serialized)
  const dryRunResult = await dryRunInternal({
    api,
    tx,
    origin: chain,
    destination,
    address,
    senderAddress,
    currency,
    feeAsset: feeCurrency,
    useRootOrigin: true
  })

  const success = !dryRunResult.failureReason
  return { call: serialized, success }
}

/**
 * Creates a type-and-then call but auto-selects the asset reserve between AssetHub and the Relay chain
 * by dry-running both variants and preferring the one that succeeds. If both fail, returns the
 * AssetHub variant. Supports only relaychain assets.
 */
export const createTypeThenAutoReserve = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedExtrinsics> => {
  // Use dry-run path only when BOTH origin and destination support it
  const originSupports = hasDryRunSupport(chain)
  const destSupports = options.destChain ? hasDryRunSupport(options.destChain) : false
  if (!(originSupports && destSupports)) {
    // Fallback: no dry-run support, default call
    return await createTypeAndThenCall(chain, options)
  }

  const relay = getRelayChainOf(chain)
  const assetHubReserve = `AssetHub${relay}` as TSubstrateChain

  const ahResult = await createCallForReserve(chain, assetHubReserve, options)
  if (ahResult.success) return ahResult.call

  const relayResult = await createCallForReserve(chain, relay, options)

  if (relayResult.success) return relayResult.call

  return ahResult.call
}
