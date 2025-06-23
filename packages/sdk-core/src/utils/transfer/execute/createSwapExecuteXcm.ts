import { findAssetForNodeOrThrow, getNativeAssetSymbol, type TMultiAsset } from '@paraspell/assets'

import { getParaId } from '../../../nodes/config'
import type { TCreateSwapXcmInternalOptions } from '../../../types'
import { addXcmVersionHeader } from '../../addXcmVersionHeader'
import { assertHasLocation } from '../../assertions'
import { localizeLocation } from '../../location'
import { createMultiAsset } from '../../multiAsset'
import { createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { isMultiHopSwap } from './isMultiHopSwap'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createExchangeInstructions = async <TApi, TRes>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes>,
  multiAssetFrom: TMultiAsset,
  multiAssetTo: TMultiAsset
) => {
  const {
    chain,
    exchangeChain,
    assetFrom,
    assetTo,
    version,
    calculateMinAmountOut,
    fees: { originReserveFee, exchangeFee }
  } = options

  const nativeSymbol = getNativeAssetSymbol(exchangeChain)
  const needsMultiHop = isMultiHopSwap(exchangeChain, assetFrom, assetTo)

  const nativeAsset = findAssetForNodeOrThrow(exchangeChain, { symbol: nativeSymbol }, null)

  assertHasLocation(nativeAsset)

  if (!needsMultiHop) {
    return [
      {
        ExchangeAsset: {
          give: createAssetsFilter(multiAssetFrom),
          want: [multiAssetTo],
          maximal: exchangeChain === 'Hydration' && exchangeFee === 0n ? true : false
        }
      }
    ]
  }

  // Multi-hop through native asset

  const nativeAmountOut = await calculateMinAmountOut(
    BigInt(assetFrom.amount) - (chain ? originReserveFee + exchangeFee : 0n),
    nativeAsset
  )

  const multiAssetNative = createMultiAsset(
    version,
    exchangeFee === 0n ? (nativeAmountOut + 1n) / 2n : nativeAmountOut,
    localizeLocation(exchangeChain, nativeAsset.multiLocation)
  )

  return [
    {
      ExchangeAsset: {
        give: createAssetsFilter(multiAssetFrom),
        want: [multiAssetNative],
        maximal: exchangeChain === 'Hydration' && exchangeFee === 0n ? true : false
      }
    },
    {
      ExchangeAsset: {
        give: createAssetsFilter(multiAssetNative),
        want: [multiAssetTo],
        maximal: true
      }
    }
  ]
}

export const createSwapExecuteXcm = async <TApi, TRes>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes>
) => {
  const {
    api,
    chain,
    exchangeChain,
    destChain,
    assetFrom,
    assetTo,
    fees: { originReserveFee, exchangeFee, destReserveFee },
    recipientAddress,
    version,
    paraIdTo
  } = options

  assertHasLocation(assetFrom)
  assertHasLocation(assetTo)

  const multiAssetFrom = createMultiAsset(
    version,
    BigInt(assetFrom.amount),
    localizeLocation(exchangeChain, assetFrom.multiLocation)
  )

  const multiAssetTo = createMultiAsset(
    version,
    // Exchange fee 0n means we are creating a dummy tx
    // Set want to 1000n to prevent NoDeal
    exchangeFee === 0n ? 1000n : BigInt(assetTo.amount),
    localizeLocation(exchangeChain, assetTo.multiLocation)
  )

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(
    {
      api,
      chain: chain ?? exchangeChain,
      destChain: destChain ?? exchangeChain,
      asset: assetFrom,
      recipientAddress,
      // Deal with this after feeAsset for swaps is supported
      fees: { originFee: 0n, reserveFee: originReserveFee },
      version
    },
    multiAssetTo
  )

  const exchangeInstructions = await createExchangeInstructions(
    options,
    multiAssetFrom,
    multiAssetTo
  )

  const exchangeToDestXcm = destChain
    ? createBaseExecuteXcm({
        chain: exchangeChain,
        destChain,
        asset: assetTo,
        paraIdTo,
        version,
        recipientAddress,
        // Deal with this after feeAsset is supported
        fees: { originFee: 0n, reserveFee: destReserveFee },
        suffixXcm: [depositInstruction]
      })
    : []

  const finalXcm = chain
    ? createBaseExecuteXcm({
        chain: chain,
        destChain: exchangeChain,
        asset: assetFrom,
        paraIdTo: getParaId(exchangeChain),
        version,
        recipientAddress,
        // Deal with this after feeAsset is supported
        fees: { originFee: 0n, reserveFee: originReserveFee },
        suffixXcm: [...exchangeInstructions, ...exchangeToDestXcm]
      })
    : [...exchangeInstructions, ...exchangeToDestXcm]

  const fullXcm = [...prefix, ...finalXcm]
  return addXcmVersionHeader(fullXcm, version)
}
