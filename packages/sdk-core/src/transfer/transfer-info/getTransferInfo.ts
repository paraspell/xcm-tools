import {
  findAssetInfoOrThrow,
  getExistentialDepositOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isAssetXcEqual,
  isChainEvm
} from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { getAssetBalanceInternal, getBalanceNative } from '../../balance'
import { InvalidParameterError } from '../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../types'
import { abstractDecimals, getRelayChainOf } from '../../utils'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { resolveFeeAsset } from '../utils'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'

export const getTransferInfo = async <TApi, TRes>({
  api,
  buildTx,
  origin,
  destination,
  senderAddress,
  ahAddress,
  address,
  currency,
  feeAsset
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  if (isChainEvm(origin) && !ahAddress) {
    throw new InvalidParameterError(`ahAddress is required for EVM origin ${origin}.`)
  }

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin)
  api.setDisconnectAllowed(false)

  try {
    const originAsset = findAssetInfoOrThrow(origin, currency, destination)

    const amount = abstractDecimals(currency.amount, originAsset.decimals, api)

    const originBalanceFee = resolvedFeeAsset
      ? await getAssetBalanceInternal({
          api,
          address: senderAddress,
          chain: origin,
          asset: resolvedFeeAsset
        })
      : await getBalanceNative({
          api,
          address: senderAddress,
          chain: origin
        })

    const originBalance = await getAssetBalanceInternal({
      api,
      address: senderAddress,
      chain: origin,
      asset: originAsset
    })

    const edOrigin = getExistentialDepositOrThrow(origin, currency)

    const {
      origin: { fee: originFee, currency: originFeeCurrency, asset: originFeeAsset },
      assetHub: assetHubFeeResult,
      bridgeHub: bridgeHubFeeResult,
      destination: destFeeDetail,
      hops
    } = await getXcmFeeInternal({
      api,
      buildTx,
      origin,
      destination,
      senderAddress,
      address,
      currency,
      feeAsset,
      disableFallback: false
    })

    const isFeeAssetAh =
      origin === 'AssetHubPolkadot' &&
      resolvedFeeAsset &&
      isAssetEqual(resolvedFeeAsset, originAsset)

    const originBalanceAfter = originBalance - amount

    const originBalanceFeeAfter = isFeeAssetAh
      ? originBalanceFee - amount
      : originBalanceFee - originFee

    const originBalanceNativeSufficient = originBalanceFee >= originFee

    const originBalanceSufficient = originBalanceAfter >= edOrigin

    let assetHub
    if (assetHubFeeResult) {
      assetHub = await buildHopInfo({
        api,
        chain: `AssetHub${getRelayChainOf(origin)}` as TSubstrateChain,
        feeData: assetHubFeeResult as { fee: bigint; currency: string },
        originChain: origin,
        currency,
        asset: assetHubFeeResult.asset,
        senderAddress,
        ahAddress
      })
    }

    let bridgeHub
    if (bridgeHubFeeResult) {
      const bridgeHubChain = `BridgeHub${getRelayChainOf(origin)}` as TSubstrateChain
      bridgeHub = await buildHopInfo({
        api,
        chain: bridgeHubChain,
        feeData: bridgeHubFeeResult as { fee: bigint; currency: string },
        originChain: origin,
        currency,
        asset: bridgeHubFeeResult.asset,
        senderAddress,
        ahAddress
      })
    }

    let builtHops: TTransferInfo['hops'] = []

    if (hops && hops.length > 0) {
      builtHops = (await Promise.all(
        hops.map(async hop => {
          const result = await buildHopInfo({
            api,
            chain: hop.chain as TSubstrateChain,
            feeData: hop.result as { fee: bigint; currency: string },
            originChain: origin,
            currency,
            asset: hop.result.asset,
            senderAddress,
            ahAddress
          })
          return {
            chain: hop.chain,
            result
          }
        })
      )) as TTransferInfo['hops']
    }

    const totalHopFee = hops.reduce(
      (acc, hop) => (isAssetXcEqual(hop.result.asset, originAsset) ? acc + hop.result.fee : acc),
      0n
    )

    const destinationInfo = await buildDestInfo({
      api,
      origin,
      destination,
      address,
      currency: {
        ...currency,
        amount
      },
      originFee,
      isFeeAssetAh: !!isFeeAssetAh,
      destFeeDetail,
      totalHopFee,
      bridgeFee: bridgeHubFeeResult?.fee
    })

    return {
      chain: {
        origin,
        destination,
        ecosystem: getRelayChainSymbol(origin)
      },
      origin: {
        selectedCurrency: {
          sufficient: originBalanceSufficient,
          balance: originBalance,
          balanceAfter: originBalanceAfter,
          currencySymbol: originAsset.symbol,
          asset: originAsset,
          existentialDeposit: edOrigin
        },
        xcmFee: {
          sufficient: originBalanceNativeSufficient,
          fee: originFee,
          balance: originBalanceFee,
          balanceAfter: originBalanceFeeAfter,
          currencySymbol: originFeeCurrency,
          asset: originFeeAsset
        }
      },
      assetHub,
      bridgeHub,
      hops: builtHops,
      destination: destinationInfo
    }
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
