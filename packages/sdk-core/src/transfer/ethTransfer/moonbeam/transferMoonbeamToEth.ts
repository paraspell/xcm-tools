/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { TMultiAsset } from '@paraspell/assets'
import {
  findAsset,
  findAssetByMultiLocation,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier
} from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import type { TransactionResponse } from 'ethers'
import { Contract } from 'ethers'
import type { WriteContractReturnType } from 'viem'
import { createPublicClient, getContract, http } from 'viem'

import { TX_CLIENT_TIMEOUT_MS } from '../../../constants'
import { BridgeHaltedError } from '../../../errors'
import { getParaId } from '../../../nodes/config'
import { type TEvmBuilderOptions, type TXcmVersioned, Version } from '../../../types'
import { createCustomXcmOnDest } from '../../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../../utils/ethereum/generateMessageId'
import { getBridgeStatus } from '../../getBridgeStatus'
import { getParaEthTransferFees } from '../getParaEthTransferFees'
import { isEthersContract, isEthersSigner } from '../utils'
import abi from './abi-xcm.json' with { type: 'json' }

// https://github.com/moonbeam-foundation/moonbeam/blob/b2b1bde7ced13aad4bd2928effc415c521fd48cb/runtime/moonbeam/src/precompiles.rs#L281
const xcmInterfacePrecompile = '0x000000000000000000000000000000000000081A'
const XCDOT = '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080'

export const transferMoonbeamToEth = async <TApi, TRes>({
  api,
  from,
  to,
  signer,
  address,
  ahAddress,
  currency
}: TEvmBuilderOptions<TApi, TRes>) => {
  if (!ahAddress) {
    throw new Error('AssetHub address is required')
  }

  const bridgeStatus = await getBridgeStatus(api.clone())

  if (bridgeStatus !== 'Normal') {
    throw new BridgeHaltedError()
  }

  if ('multiasset' in currency) {
    throw new Error('Multiassets syntax is not supported for Evm transfers')
  }

  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    throw new Error('Override multilocation is not supported for Evm transfers')
  }

  const foundAsset = findAsset(from, currency, to)

  if (foundAsset === null) {
    throw new InvalidCurrencyError(
      `Origin node ${from} does not support currency ${JSON.stringify(currency)}.`
    )
  }

  if (!isForeignAsset(foundAsset) || !foundAsset.multiLocation) {
    throw new InvalidCurrencyError('Currency must be a foreign asset with valid multi-location')
  }

  const ethAsset = findAssetByMultiLocation(getOtherAssets('Ethereum'), foundAsset.multiLocation)

  if (!ethAsset || !ethAsset.assetId) {
    throw new InvalidCurrencyError(
      `Could not obtain Ethereum asset address for ${JSON.stringify(foundAsset)}`
    )
  }

  const contract = isEthersSigner(signer)
    ? new Contract(xcmInterfacePrecompile, abi, signer)
    : getContract({
        abi,
        address: xcmInterfacePrecompile,
        client: {
          public: createPublicClient({
            chain: signer.chain,
            transport: http()
          }),
          wallet: signer
        }
      })

  const senderAddress = isEthersSigner(signer) ? await signer.getAddress() : signer.account?.address

  if (!senderAddress) {
    throw new Error('Unable to get sender address')
  }

  await api.init(from, TX_CLIENT_TIMEOUT_MS)

  const messageId = await generateMessageId(
    api,
    senderAddress,
    getParaId(from),
    ethAsset.assetId,
    address,
    currency.amount
  )

  const customXcm = createCustomXcmOnDest(
    {
      api,
      destination: to,
      address,
      scenario: 'ParaToPara',
      senderAddress,
      ahAddress,
      asset: { ...foundAsset, amount: currency.amount },
      header: {} as TXcmVersioned<TMultiLocation>,
      currencySelection: {} as TXcmVersioned<TMultiAsset[]>,
      addressSelection: {} as TXcmVersioned<TMultiLocation>
    },
    from,
    Version.V4,
    messageId
  )

  const customXcmOnDest = await api.objectToHex(customXcm, 'XcmVersionedXcm')

  const assetHubApi = await api.createApiForNode('AssetHubPolkadot')

  const [bridgeFee, executionFee] = await getParaEthTransferFees(assetHubApi)

  const transferFee = (bridgeFee + executionFee).toString()

  // Partially inspired by Moonbeam XCM-SDK
  // https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/sdk/src/contract/contracts/Xtokens/Xtokens.ts#L53
  const createTx = (
    func: string,
    args: unknown[]
  ): Promise<TransactionResponse | WriteContractReturnType> => {
    if (isEthersContract(contract)) {
      return contract[func](...args)
    }

    return contract.write[func](args as any)
  }

  const numberToHex32 = (num: number) =>
    typeof num !== 'number' || isNaN(num)
      ? (() => {
          throw new Error('Input must be a valid number')
        })()
      : `0x${(num >>> 0).toString(16).padStart(8, '0')}`

  // Execute the custom XCM message with the precompile
  const tx = await createTx(
    isEthersSigner(signer)
      ? 'transferAssetsUsingTypeAndThenAddress((uint8,bytes[]),(address,uint256)[],uint8,uint8,uint8,bytes)'
      : 'transferAssetsUsingTypeAndThenAddress',
    [
      // This represents (1,X1(Parachain(1000)))
      [1, ['0x00' + numberToHex32(getParaId('AssetHubPolkadot')).slice(2)]],
      // Assets including fee and the ERC20 asset, with fee be the first
      [
        [XCDOT, transferFee],
        [ethAsset.assetId, currency.amount.toString()]
      ],
      // The TransferType corresponding to asset being sent, 2 represents `DestinationReserve`
      2,
      // index for the fee
      0,
      // The TransferType corresponding to fee asset
      2,
      customXcmOnDest
    ]
  )

  return typeof tx === 'object' ? tx.hash : tx
}
