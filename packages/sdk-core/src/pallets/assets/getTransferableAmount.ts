import {
  findAsset,
  getExistentialDeposit,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'

import type {
  TGetMaxForeignTransferableAmountOptions,
  TGetMaxNativeTransferableAmountOptions,
  TGetTransferableAmountOptions
} from '../../types/TBalance'
import { isRelayChain } from '../../utils'
import { validateAddress } from '../../utils/validateAddress'
import { getBalanceForeignInternal } from './balance/getBalanceForeign'
import { getBalanceNativeInternal } from './balance/getBalanceNative'

export const getMaxNativeTransferableAmount = async <TApi, TRes>({
  api,
  address,
  node,
  currency
}: TGetMaxNativeTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(address, node, false)

  const ed = getExistentialDeposit(node, currency)

  if (ed === null) {
    throw new Error(`Cannot get existential deposit for node ${node}`)
  }
  const edBN = BigInt(ed)
  const nativeBalance = await getBalanceNativeInternal({
    address,
    node,
    api,
    currency
  })

  const maxTransferableAmount = nativeBalance - edBN
  return maxTransferableAmount > 0n ? maxTransferableAmount : 0n
}

export const getMaxForeignTransferableAmount = async <TApi, TRes>({
  api,
  address,
  node,
  currency
}: TGetMaxForeignTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(address, node, false)

  const asset =
    findAsset(node, currency, null) ??
    (node === 'AssetHubPolkadot' ? findAsset('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${node}`)
  }

  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} is not a foreign asset`)
  }

  const ed = asset.existentialDeposit

  if (!ed) {
    throw new Error(`Cannot get existential deposit for asset ${JSON.stringify(asset)}`)
  }

  const edBN = BigInt(ed)
  const balance = await getBalanceForeignInternal({
    address,
    node,
    api,
    currency
  })
  const maxTransferableAmount = balance - edBN
  return maxTransferableAmount > 0n ? maxTransferableAmount : 0n
}

export const getTransferableAmount = async <TApi, TRes>({
  api,
  address,
  node,
  currency
}: TGetTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(address, node, false)

  const asset =
    findAsset(node, currency, null) ??
    (node === 'AssetHubPolkadot' ? findAsset('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${node}`)
  }

  if (isForeignAsset(asset) && !isRelayChain(node)) {
    return getMaxForeignTransferableAmount({ api, address, node, currency })
  } else {
    return getMaxNativeTransferableAmount({
      api,
      address,
      node,
      currency: {
        symbol: asset.symbol
      }
    })
  }
}
