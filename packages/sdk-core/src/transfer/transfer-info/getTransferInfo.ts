import {
  findAssetInfoOrThrow,
  getExistentialDepositOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isAssetXcEqual,
  isChainEvm
} from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { getAssetBalanceInternal, getBalanceInternal } from '../../balance'
import { MissingParameterError } from '../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../types'
import { abstractDecimals } from '../../utils'
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
    throw new MissingParameterError('ahAddress', `ahAddress is required for EVM origin ${origin}.`)
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
      : await getBalanceInternal({
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
      origin: { fee: originFee, asset: originFeeAsset },
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

    let builtHops: TTransferInfo['hops'] = []

    if (hops && hops.length > 0) {
      builtHops = (await Promise.all(
        hops.map(async hop => {
          const result = await buildHopInfo({
            api,
            chain: hop.chain as TSubstrateChain,
            fee: hop.result.fee,
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

    const bridgeHop = hops.find(hop => hop.chain.startsWith('BridgeHub'))

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
      bridgeFee: bridgeHop?.result.fee
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
          asset: originAsset
        },
        xcmFee: {
          sufficient: originBalanceNativeSufficient,
          fee: originFee,
          balance: originBalanceFee,
          balanceAfter: originBalanceFeeAfter,
          asset: originFeeAsset
        }
      },
      hops: builtHops,
      destination: destinationInfo
    }
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
