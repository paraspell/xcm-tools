import type { TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  findAssetInfoOrThrow,
  formatAssetIdToERC20,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isOverrideLocationSpecifier,
  parseUnits,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import type { Address, TransactionSerializableEIP1559 } from 'viem'
import { encodeFunctionData, maxUint64 } from 'viem'

import { getViemChain } from '../chains'
import abi from './abi.json' with { type: 'json' }
import { buildMoonbeamLocal } from './buildMoonbeamLocal'
import { getDestinationLocation } from './getDestinationLocation'

const CONTRACT_ADDRESS: Address = '0x0000000000000000000000000000000000000804'
const NATIVE_ASSET_ID = '0x0000000000000000000000000000000000000802'

export const buildMoonbeamEvm = <TApi, TRes, TSigner>(
  options: TBuildEvmTransferOptions<TApi, TRes, TSigner>
): TransactionSerializableEIP1559 => {
  const { api, from, to, recipient, currency } = options

  if (Array.isArray(currency)) {
    throw new UnsupportedOperationError('Multi-assets are not yet supported for EVM transfers')
  }

  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    throw new UnsupportedOperationError('Override location is not supported for EVM transfers')
  }

  const foundAsset = findAssetInfoOrThrow(from, currency, to)
  const amount = abstractDecimals(currency.amount, foundAsset.decimals, api)

  if (from === to) {
    return buildMoonbeamLocal(from, { ...foundAsset, amount }, recipient)
  }

  let asset: string
  if (foundAsset.symbol === getNativeAssetSymbol(from)) {
    asset = NATIVE_ASSET_ID
  } else {
    if (foundAsset.assetId === undefined) {
      throw new InvalidCurrencyError('Currency must be a foreign asset with valid assetId')
    }
    asset = formatAssetIdToERC20(foundAsset.assetId)
  }

  const destLocation = getDestinationLocation(api, recipient, to)
  const weight = maxUint64

  const multiCurrencySymbols = ['xcPINK', 'xcDED', 'xcSTINK', 'xcWIFD', 'xcNCTR']
  const useMultiAssets =
    from === 'Moonbeam' &&
    to === 'AssetHubPolkadot' &&
    multiCurrencySymbols.includes(foundAsset.symbol)

  const usdtAsset = findAssetInfoOrThrow(from, { symbol: 'xcUSDT' }, to)
  assertHasId(usdtAsset)

  const usdtAmount = parseUnits('0.2', usdtAsset.decimals)

  const data = useMultiAssets
    ? encodeFunctionData({
        abi,
        functionName: 'transferMultiCurrencies',
        args: [
          [
            [asset, amount.toString()],
            [formatAssetIdToERC20(usdtAsset.assetId), usdtAmount.toString()]
          ],
          1, // index of the fee asset
          destLocation,
          weight
        ]
      })
    : encodeFunctionData({
        abi,
        functionName: 'transfer',
        args: [asset, amount.toString(), destLocation, weight]
      })

  return {
    type: 'eip1559',
    chainId: getViemChain(from).id,
    to: CONTRACT_ADDRESS,
    data,
    value: 0n
  }
}
