/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { TAsset } from '@paraspell/assets'
import {
  findAssetInfoByLoc,
  findAssetInfoOrThrow,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideLocationSpecifier
} from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import type { WriteContractReturnType } from 'viem'
import { createPublicClient, getContract, http } from 'viem'

import { getParaId } from '../../../chains/config'
import { TX_CLIENT_TIMEOUT_MS } from '../../../constants'
import { BridgeHaltedError, InvalidParameterError } from '../../../errors'
import { type TEvmBuilderOptions } from '../../../types'
import { abstractDecimals } from '../../../utils'
import { createCustomXcmOnDest } from '../../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../../utils/ethereum/generateMessageId'
import { getBridgeStatus } from '../../getBridgeStatus'
import { getParaEthTransferFees } from '../getParaEthTransferFees'
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
    throw new InvalidParameterError('AssetHub address is required')
  }

  const bridgeStatus = await getBridgeStatus(api.clone())

  if (bridgeStatus !== 'Normal') {
    throw new BridgeHaltedError()
  }

  if (Array.isArray(currency)) {
    throw new InvalidParameterError('Multi-assets are not yet supported for EVM transfers')
  }

  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    throw new InvalidParameterError('Override location is not supported for EVM transfers')
  }

  const foundAsset = findAssetInfoOrThrow(from, currency, to)

  const amount = abstractDecimals(currency.amount, foundAsset.decimals, api)

  if (!isForeignAsset(foundAsset) || !foundAsset.location) {
    throw new InvalidCurrencyError('Currency must be a foreign asset with a valid location')
  }

  const ethAsset = findAssetInfoByLoc(getOtherAssets('Ethereum'), foundAsset.location)

  if (!ethAsset || !ethAsset.assetId) {
    throw new InvalidCurrencyError(
      `Could not obtain Ethereum asset address for ${JSON.stringify(foundAsset)}`
    )
  }

  const contract = getContract({
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

  const senderAddress = signer.account?.address

  if (!senderAddress) {
    throw new InvalidParameterError('Unable to get sender address')
  }

  await api.init(from, TX_CLIENT_TIMEOUT_MS)

  const messageId = await generateMessageId(
    api,
    senderAddress,
    getParaId(from),
    ethAsset.assetId,
    address,
    amount
  )

  const customXcm = createCustomXcmOnDest(
    {
      api,
      destination: to,
      address,
      scenario: 'ParaToPara',
      senderAddress,
      ahAddress,
      assetInfo: { ...foundAsset, amount },
      currency,
      destLocation: {} as TLocation,
      asset: {} as TAsset,
      beneficiaryLocation: {} as TLocation,
      version: Version.V4
    },
    from,
    messageId
  )

  const customXcmOnDest = await api.objectToHex(customXcm, 'XcmVersionedXcm')

  const assetHubApi = await api.createApiForChain('AssetHubPolkadot')

  const [bridgeFee, executionFee] = await getParaEthTransferFees(assetHubApi)

  const transferFee = (bridgeFee + executionFee).toString()

  // Partially inspired by Moonbeam XCM-SDK
  // https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/sdk/src/contract/contracts/Xtokens/Xtokens.ts#L53
  const createTx = (func: string, args: unknown[]): Promise<WriteContractReturnType> => {
    return contract.write[func](args as any)
  }

  const numberToHex32 = (num: number) =>
    typeof num !== 'number' || isNaN(num)
      ? (() => {
          throw new InvalidParameterError('Input must be a valid number')
        })()
      : `0x${(num >>> 0).toString(16).padStart(8, '0')}`

  // Execute the custom XCM message with the precompile
  const tx = await createTx('transferAssetsUsingTypeAndThenAddress', [
    // This represents (1,X1(Parachain(1000)))
    [1, ['0x00' + numberToHex32(getParaId('AssetHubPolkadot')).slice(2)]],
    // Assets including fee and the ERC20 asset, with fee be the first
    [
      [XCDOT, transferFee],
      [ethAsset.assetId, amount.toString()]
    ],
    // The TransferType corresponding to asset being sent, 2 represents `DestinationReserve`
    2,
    // index for the fee
    0,
    // The TransferType corresponding to fee asset
    2,
    customXcmOnDest
  ])

  return tx
}
