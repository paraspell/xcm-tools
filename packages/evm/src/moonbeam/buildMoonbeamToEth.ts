import type { TBuildEvmTransferOptions, TLocation, TSubstrateChain } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  BridgeHaltedError,
  createAsset,
  createCustomXcmOnDest,
  findAssetInfoOrThrow,
  generateMessageId,
  getBridgeStatus,
  getParaEthTransferFees,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError,
  NumberFormatError,
  pickCompatibleXcmVersion,
  TX_CLIENT_TIMEOUT_MS,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import type { Address, TransactionSerializableEIP1559 } from 'viem'
import { encodeFunctionData } from 'viem'

import { getViemChain } from '../chains'
import abi from './abi-xcm.json' with { type: 'json' }

// https://github.com/moonbeam-foundation/moonbeam/blob/b2b1bde7ced13aad4bd2928effc415c521fd48cb/runtime/moonbeam/src/precompiles.rs#L281
const xcmInterfacePrecompile: Address = '0x000000000000000000000000000000000000081A'
const XCDOT = '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080'

export const buildMoonbeamToEth = async <TApi, TRes, TSigner>(
  from: TSubstrateChain,
  options: TBuildEvmTransferOptions<TApi, TRes, TSigner>
): Promise<TransactionSerializableEIP1559> => {
  const { api, to, sender, recipient, ahAddress, currency } = options

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

  const ethAsset = findAssetInfoOrThrow('Ethereum', { symbol: foundAsset.symbol })
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

  const version = pickCompatibleXcmVersion(from, to)
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
      asset: createAsset(version, amount, ethAsset.location),
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

  const numberToHex32 = (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) {
      throw new NumberFormatError('Input must be a valid number')
    }
    return `0x${(num >>> 0).toString(16).padStart(8, '0')}`
  }

  const data = encodeFunctionData({
    abi,
    functionName: 'transferAssetsUsingTypeAndThenAddress',
    args: [
      // (1, X1(Parachain(1000)))
      [1, ['0x00' + numberToHex32(getParaId('AssetHubPolkadot')).slice(2)]],
      // Assets including fee and the ERC20 asset, with fee first
      [
        [XCDOT, transferFee],
        [ethAsset.assetId, amount.toString()]
      ],
      // 2 == DestinationReserve
      2,
      // index of the fee asset
      0,
      // TransferType for fee asset (DestinationReserve)
      2,
      customXcmOnDest
    ]
  })

  return {
    type: 'eip1559',
    chainId: getViemChain(from).id,
    to: xcmInterfacePrecompile,
    data,
    value: 0n
  }
}
