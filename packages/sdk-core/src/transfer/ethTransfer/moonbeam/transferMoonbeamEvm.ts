/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TForeignAsset } from '@paraspell/assets'
import {
  findAssetForNodeOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier
} from '@paraspell/assets'
import { type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import type { WriteContractReturnType } from 'viem'
import { createPublicClient, getContract, http } from 'viem'

import { InvalidParameterError } from '../../../errors'
import { formatAssetIdToERC20 } from '../../../pallets/assets/balance'
import type { TEvmBuilderOptions } from '../../../types'
// Inspired by Moonbeam XCM-SDK
import abi from './abi.json' with { type: 'json' }
import { getDestinationMultilocation } from './getDestinationMultilocation'

const U_64_MAX = 18446744073709551615n
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000804'
const NATIVE_ASSET_ID = '0x0000000000000000000000000000000000000802'

// Partially inspired by Moonbeam XCM-SDK
export const transferMoonbeamEvm = async <TApi, TRes>({
  api,
  from,
  to,
  signer,
  address,
  currency
}: TEvmBuilderOptions<TApi, TRes>): Promise<string> => {
  if ('multiasset' in currency) {
    throw new InvalidParameterError('Multiassets syntax is not supported for Evm transfers')
  }

  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    throw new InvalidParameterError('Override multilocation is not supported for Evm transfers')
  }

  const contract = getContract({
    abi,
    address: CONTRACT_ADDRESS,
    client: {
      public: createPublicClient({
        chain: signer.chain,
        transport: http()
      }),
      wallet: signer
    }
  })

  const foundAsset = findAssetForNodeOrThrow(from, currency, to)

  let asset: string
  if (foundAsset.symbol === getNativeAssetSymbol(from)) {
    asset = NATIVE_ASSET_ID
  } else {
    // Otherwise, proceed as a foreign asset
    if (!isForeignAsset(foundAsset) || !foundAsset.assetId) {
      throw new InvalidCurrencyError('Currency must be a foreign asset with valid assetId')
    }
    asset = formatAssetIdToERC20(foundAsset.assetId)
  }

  const destMultiLocation = getDestinationMultilocation(
    api,
    address,
    to as TNodeDotKsmWithRelayChains
  )

  const weight = U_64_MAX

  // Partially inspired by Moonbeam XCM-SDK
  // https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/sdk/src/contract/contracts/Xtokens/Xtokens.ts#L53
  const createTx = (func: string, args: unknown[]): Promise<WriteContractReturnType> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return contract.write[func](args as any)
  }

  const multiCurrencySymbols = ['xcPINK', 'xcDED', 'xcSTINK', 'xcWIFD', 'xcNCTR']
  const useMultiAssets =
    from === 'Moonbeam' &&
    to === 'AssetHubPolkadot' &&
    multiCurrencySymbols.includes(foundAsset.symbol)

  const usdtAsset = findAssetForNodeOrThrow(from, { symbol: 'xcUSDT' }, to) as TForeignAsset

  const tx = useMultiAssets
    ? await createTx('transferMultiCurrencies', [
        [
          [asset, currency.amount],
          [formatAssetIdToERC20(usdtAsset.assetId ?? ''), '200000']
        ],
        1, // index of the fee asset
        destMultiLocation,
        weight
      ])
    : await createTx('transfer', [asset, currency.amount, destMultiLocation, weight])

  return tx
}
