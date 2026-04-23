import {
  findAssetInfoOrThrow,
  getExistentialDepositOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isAssetXcEqual,
  isChainEvm
} from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { getAssetBalanceInternal } from '../../balance'
import { MissingParameterError } from '../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../types'
import { abstractDecimals } from '../../utils'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { resolveFeeAsset } from '../utils'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'

export const getTransferInfo = async <TApi, TRes, TSigner>({
  api,
  buildTx,
  origin,
  destination,
  sender,
  ahAddress,
  recipient,
  currency,
  feeAsset,
  version
}: TGetTransferInfoOptions<TApi, TRes, TSigner>): Promise<TTransferInfo> => {
  if (isChainEvm(origin) && !ahAddress) {
    throw new MissingParameterError('ahAddress', `ahAddress is required for EVM origin ${origin}.`)
  }

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin)
  api.disconnectAllowed = false

  try {
    const originAsset = findAssetInfoOrThrow(origin, currency, destination)

    const amount = abstractDecimals(currency.amount, originAsset.decimals, api)

    const originBalance = await getAssetBalanceInternal({
      api,
      address: sender,
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
      sender,
      recipient,
      currency,
      feeAsset,
      version,
      disableFallback: false
    })

    const originBalanceFee = await getAssetBalanceInternal({
      api,
      address: sender,
      chain: origin,
      asset: originFeeAsset
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
      builtHops = await Promise.all(
        hops.map(async hop => {
          const result = await buildHopInfo({
            api,
            chain: hop.chain as TSubstrateChain,
            fee: hop.result.fee,
            originChain: origin,
            currency,
            asset: hop.result.asset,
            sender,
            ahAddress
          })
          return {
            chain: hop.chain,
            result
          }
        })
      )
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
      recipient,
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
    api.disconnectAllowed = true
    await api.disconnect()
  }
}
