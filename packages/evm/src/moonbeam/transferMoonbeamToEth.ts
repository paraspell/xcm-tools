import type { TAsset, TEvmTransferOptions, TLocation, TSubstrateChain } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  assertSender,
  BridgeHaltedError,
  createCustomXcmOnDest,
  findAssetInfoOrThrow,
  generateMessageId,
  getBridgeStatus,
  getParaEthTransferFees,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError,
  NumberFormatError,
  TX_CLIENT_TIMEOUT_MS,
  UnsupportedOperationError,
  Version
} from '@paraspell/sdk-core'
import type { WriteContractReturnType } from 'viem'
import { createPublicClient, getContract, http } from 'viem'

import abi from './abi-xcm.json' with { type: 'json' }

// https://github.com/moonbeam-foundation/moonbeam/blob/b2b1bde7ced13aad4bd2928effc415c521fd48cb/runtime/moonbeam/src/precompiles.rs#L281
const xcmInterfacePrecompile = '0x000000000000000000000000000000000000081A'
const XCDOT = '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080'

export const transferMoonbeamToEth = async <TApi, TRes, TSigner>(
  from: TSubstrateChain,
  { api, to, signer, recipient, ahAddress, currency }: TEvmTransferOptions<TApi, TRes, TSigner>
) => {
  if (!ahAddress) {
    throw new MissingParameterError('ahAddress')
  }

  const bridgeStatus = await getBridgeStatus(api.clone())

  if (bridgeStatus !== 'Normal') {
    throw new BridgeHaltedError()
  }

  if (Array.isArray(currency)) {
    throw new UnsupportedOperationError('Multi-assets are not yet supported for EVM transfers')
  }

  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    throw new UnsupportedOperationError('Override location is not supported for EVM transfers')
  }

  const foundAsset = findAssetInfoOrThrow(from, currency, to)

  const amount = abstractDecimals(currency.amount, foundAsset.decimals, api)

  const ethAsset = findAssetInfoOrThrow('Ethereum', {
    symbol: foundAsset.symbol
  })

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

  const sender = signer.account?.address

  assertSender(sender)
  assertHasId(ethAsset)

  await api.init(from, TX_CLIENT_TIMEOUT_MS)

  const messageId = await generateMessageId(
    api,
    sender,
    getParaId(from),
    ethAsset.assetId,
    recipient,
    amount
  )

  const version = Version.V4

  const customXcm = createCustomXcmOnDest(
    {
      api,
      chain: from,
      destination: to,
      recipient,
      scenario: 'ParaToPara',
      sender,
      ahAddress,
      assetInfo: { ...foundAsset, amount },
      currency,
      asset: {} as TAsset,
      beneficiaryLocation: {} as TLocation,
      version
    },
    from,
    messageId,
    ethAsset
  )

  const customXcmOnDest = await api.objectToHex(customXcm, 'XcmVersionedXcm', version)

  const assetHubApi = await api.createApiForChain('AssetHubPolkadot')

  const [bridgeFee, executionFee] = await getParaEthTransferFees(assetHubApi)

  const transferFee = (bridgeFee + executionFee).toString()

  // Partially inspired by Moonbeam XCM-SDK
  // https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/sdk/src/contract/contracts/Xtokens/Xtokens.ts#L53
  const createTx = (func: string, args: unknown[]): Promise<WriteContractReturnType> => {
    return contract.write[func](args)
  }

  const numberToHex32 = (num: number) =>
    typeof num !== 'number' || isNaN(num)
      ? (() => {
          throw new NumberFormatError('Input must be a valid number')
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
