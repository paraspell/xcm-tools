import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { DryRunFailedError, InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type { THopInfo, TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import { assertAddressIsString, assertHasLocation, getRelayChainOf } from '../../utils'
import { getAssetReserveChain } from '../../utils/transfer/execute/getAssetReserveChain'
import { dryRunInternal } from '../dryRun/dryRunInternal'
import { padFeeBy } from '../fees'
import { createTypeAndThenCall } from './createTypeAndThenCall'

const validateHops = (hops: THopInfo[]): void => {
  for (const hop of hops) {
    if (!hop.result.success) {
      throw new DryRunFailedError(
        `Dry run failed on an intermediate hop (${hop.chain}). Reason: ${
          hop.result.failureReason || 'Unknown'
        }`
      )
    }
  }
}

const getReserveFeeFromHops = (hops: THopInfo[] | undefined): bigint => {
  if (!hops || hops.length === 0 || !hops[0].result.success) {
    return MIN_FEE
  }

  return hops[0].result.fee
}

const MIN_FEE = 1000n
const FEE_PADDING_PERCENTAGE = 40

export const createTypeAndThenTransfer = async <TApi, TRes>(
  chain: TNodeDotKsmWithRelayChains,
  input: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedApiCall> => {
  const { api, address, paraIdTo, senderAddress, currency, asset } = input

  if (!senderAddress) {
    throw new InvalidParameterError('Please provide senderAddress')
  }

  assertHasLocation(asset)
  assertAddressIsString(address)

  const destChain = getTNode(
    paraIdTo as number,
    getRelayChainOf(chain).toLowerCase() as TEcosystemType
  ) as TNodePolkadotKusama

  const reserveChain = isRelayChain(destChain)
    ? destChain
    : getAssetReserveChain(chain, chain, asset.multiLocation)

  const call = createTypeAndThenCall(chain, destChain, reserveChain, input, MIN_FEE)

  if (chain === reserveChain || destChain === reserveChain) return call

  const dryRunResult = await dryRunInternal({
    api,
    tx: api.callTxMethod(call),
    origin: chain,
    destination: destChain,
    senderAddress,
    address,
    currency
  })

  if (!dryRunResult.origin.success) {
    throw new DryRunFailedError(dryRunResult.failureReason as string)
  }

  validateHops(dryRunResult.hops)

  const reserveFeeEstimate = getReserveFeeFromHops(dryRunResult.hops)
  const reserveFee = padFeeBy(reserveFeeEstimate, FEE_PADDING_PERCENTAGE)

  return createTypeAndThenCall(chain, destChain, reserveChain, input, reserveFee)
}
