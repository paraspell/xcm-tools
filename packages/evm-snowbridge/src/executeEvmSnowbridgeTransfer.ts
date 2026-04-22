import type { TEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  findAssetInfoOrThrow,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError,
  RoutingResolutionError,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import { SnowbridgeApi, toPolkadotV2 } from '@snowbridge/api'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import { createPublicClient, custom } from 'viem'

import { createEnvironment } from './createEnvironment'

export const executeEvmSnowbridgeTransfer = async <TApi, TRes, TSigner>({
  api,
  signer,
  recipient,
  to,
  currency
}: TEvmTransferOptions<TApi, TRes, TSigner>): Promise<string> => {
  if (Array.isArray(currency)) {
    throw new UnsupportedOperationError(
      'Multi-assets are not yet supported for Snowbridge transfers'
    )
  }

  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    throw new UnsupportedOperationError(
      'Override location is not supported for Snowbridge transfers'
    )
  }

  const ethAsset = findAssetInfoOrThrow('Ethereum', currency, to)

  const amount = abstractDecimals(currency.amount, ethAsset.decimals, api)

  const info = bridgeInfoFor('polkadot_mainnet')
  const environment = createEnvironment(info.environment)
  const snowbridgeApi = new SnowbridgeApi({
    info: { ...info, environment },
    ethereumProvider: new ViemEthereumProvider()
  })

  const publicClient = createPublicClient({
    transport: custom(signer.transport),
    chain: signer.chain
  })
  snowbridgeApi.context.setEthProvider(environment.ethChainId, publicClient)

  const destParaId = getParaId(to)

  assertHasId(ethAsset)

  const sender = snowbridgeApi.sender(
    { kind: 'ethereum', id: environment.ethChainId },
    { kind: 'polkadot', id: destParaId }
  )

  const account = signer.account ?? (await signer.getAddresses())[0]
  if (!account) {
    throw new MissingParameterError(
      'signer.account',
      'viem WalletClient must have an account configured.'
    )
  }
  const sourceAddress = typeof account === 'string' ? account : account.address

  const fee = await sender.fee(ethAsset.assetId)
  const transfer = await sender.tx(sourceAddress, recipient, ethAsset.assetId, amount, fee)
  const validated = await sender.validate(transfer)

  if (validated.logs.find(l => l.kind === toPolkadotV2.ValidationKind.Error)) {
    throw new RoutingResolutionError(
      `Validation failed with following errors: \n\n ${validated.logs
        .filter(l => l.kind === toPolkadotV2.ValidationKind.Error)
        .map(l => l.message)
        .join('\n\n')}`
    )
  }

  const hash = await signer.sendTransaction({
    ...transfer.tx,
    account,
    chain: signer.chain ?? null
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new RoutingResolutionError(`Transaction ${hash} not included.`)
  }

  const messageReceipt = await sender.messageId(receipt)
  if (!messageReceipt) {
    throw new RoutingResolutionError(`Transaction ${hash} did not emit a message.`)
  }

  return hash
}
