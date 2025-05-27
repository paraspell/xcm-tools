import {
  findAssetForNodeOrThrow,
  getExistentialDeposit,
  getRelayChainSymbol,
  isAssetEqual,
  isNodeEvm
} from '@paraspell/assets'

import { InvalidParameterError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import { resolveFeeAsset } from '../../../transfer/utils/resolveFeeAsset'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { determineRelayChain } from '../../../utils'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'

export const getTransferInfo = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  ahAddress,
  address,
  currency,
  feeAsset
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  if (isNodeEvm(origin) && !ahAddress) {
    throw new InvalidParameterError(`ahAddress is required for EVM origin ${origin}.`)
  }

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin)
  api.setDisconnectAllowed(false)

  try {
    const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

    const originBalanceFee =
      feeAsset && resolvedFeeAsset
        ? await getAssetBalanceInternal({
            api,
            address: senderAddress,
            node: origin,
            currency: feeAsset
          })
        : await getBalanceNativeInternal({
            api,
            address: senderAddress,
            node: origin
          })

    const originBalance = await getAssetBalanceInternal({
      api,
      address: senderAddress,
      node: origin,
      currency
    })

    const edOrigin = getExistentialDeposit(origin, currency)

    if (!edOrigin) {
      throw new InvalidParameterError(
        `Existential deposit not found for ${origin} with currency ${JSON.stringify(currency)}`
      )
    }

    const edOriginBn = BigInt(edOrigin)

    const {
      origin: { fee: originFee, currency: originFeeCurrency },
      assetHub: assetHubFeeResult,
      bridgeHub: bridgeHubFeeResult,
      destination: destFeeDetail
    } = await getXcmFee({
      api,
      tx,
      origin,
      destination,
      senderAddress,
      address,
      currency,
      feeAsset,
      disableFallback: false
    })

    if (originFee === undefined) {
      throw new InvalidParameterError(
        `Cannot get origin xcm fee for currency ${JSON.stringify(currency)} on node ${origin}.`
      )
    }

    const isFeeAssetAh =
      origin === 'AssetHubPolkadot' &&
      resolvedFeeAsset &&
      isAssetEqual(resolvedFeeAsset, originAsset)

    const originBalanceAfter = originBalance - BigInt(currency.amount)

    const originBalanceFeeAfter = isFeeAssetAh
      ? originBalanceFee - BigInt(currency.amount)
      : originBalanceFee - originFee

    const originBalanceNativeSufficient = originBalanceFee >= originFee

    const originBalanceSufficient = originBalanceAfter >= edOriginBn

    let assetHub
    if (assetHubFeeResult) {
      assetHub = await buildHopInfo({
        api,
        node: determineRelayChain(origin) === 'Polkadot' ? 'AssetHubPolkadot' : 'AssetHubKusama',
        feeData: assetHubFeeResult as { fee: bigint; currency: string },
        originNode: origin,
        currency,
        senderAddress,
        ahAddress
      })
    }

    let bridgeHub
    if (bridgeHubFeeResult) {
      const bridgeHubNode =
        determineRelayChain(origin) === 'Polkadot' ? 'BridgeHubPolkadot' : 'BridgeHubKusama'
      bridgeHub = await buildHopInfo({
        api,
        node: bridgeHubNode,
        feeData: bridgeHubFeeResult as { fee: bigint; currency: string },
        originNode: origin,
        currency,
        senderAddress,
        ahAddress
      })
    }

    const destinationInfo = await buildDestInfo({
      api,
      origin,
      destination,
      address,
      currency,
      originFee,
      isFeeAssetAh: !!isFeeAssetAh,
      destFeeDetail,
      assetHubFee: assetHubFeeResult?.fee,
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
          existentialDeposit: edOriginBn
        },
        xcmFee: {
          sufficient: originBalanceNativeSufficient,
          fee: originFee,
          balance: originBalanceFee,
          balanceAfter: originBalanceFeeAfter,
          currencySymbol: originFeeCurrency as string
        }
      },
      assetHub,
      bridgeHub,
      destination: destinationInfo
    }
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
