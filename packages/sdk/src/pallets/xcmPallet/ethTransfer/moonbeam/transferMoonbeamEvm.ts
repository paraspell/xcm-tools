import type { TransactionResponse } from 'ethers'
import { Contract } from 'ethers'
import type { TEvmBuilderOptions, TForeignAsset } from '../../../../types'
import { getNativeAssetSymbol } from '../../../assets'
import { getAssetBySymbolOrId } from '../../../assets/getAssetBySymbolOrId'
import { InvalidCurrencyError } from '../../../../errors'
import { isForeignAsset } from '../../../../utils'
import type { WriteContractReturnType } from 'viem'
import { createPublicClient, getContract, http } from 'viem'
import { isEthersContract, isEthersSigner } from '../utils'
import { formatAssetIdToERC20 } from './formatAssetIdToERC20'
import { getDestinationMultilocation } from './getDestinationMultilocation'

// Inspired by Moonbeam XCM-SDK
import abi from './abi.json' with { type: 'json' }

const U_64_MAX = BigInt('18446744073709551615')
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
  const contract = isEthersSigner(signer)
    ? new Contract(CONTRACT_ADDRESS, abi, signer)
    : getContract({
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

  const foundAsset = getAssetBySymbolOrId(from, currency, to)

  if (foundAsset === null) {
    throw new InvalidCurrencyError(
      `Origin node ${from} does not support currency ${JSON.stringify(currency)}.`
    )
  }

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

  const destMultiLocation = getDestinationMultilocation(api, address, to)

  const weight = U_64_MAX

  // Partially inspired by Moonbeam XCM-SDK
  // https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/sdk/src/contract/contracts/Xtokens/Xtokens.ts#L53
  const createTx = (
    func: string,
    args: unknown[]
  ): Promise<TransactionResponse | WriteContractReturnType> => {
    if (isEthersContract(contract)) {
      return contract[func](...args)
    }

    return contract.write[func](args)
  }

  const multiCurrencySymbols = ['xcPINK', 'xcDED', 'xcSTINK', 'xcWIFD', 'xcNCTR']
  const useMultiAssets =
    from === 'Moonbeam' &&
    to === 'AssetHubPolkadot' &&
    multiCurrencySymbols.includes(foundAsset.symbol)

  const usdtAsset = getAssetBySymbolOrId(from, { symbol: 'xcUSDT' }, to) as TForeignAsset

  const tx: TransactionResponse | WriteContractReturnType = useMultiAssets
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

  return typeof tx === 'object' ? tx.hash : tx
}
