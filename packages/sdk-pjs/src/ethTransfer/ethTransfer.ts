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
import { EthersEthereumProvider } from '@snowbridge/provider-ethers'
import { bridgeInfoFor } from '@snowbridge/registry'

import type { TPjsEvmBuilderOptions } from '../types'
import { isEthersSigner } from '../utils'
import { createEnvironment } from './createEnvironment'

/**
 * Transfers an Ethereum asset to a Polkadot account.
 *
 * @param provider - The Ethereum provider instance to interact with the Ethereum network.
 * @param options - The options for the transfer.
 *
 * @returns A Promise that resolves to an object containing the result and the plan of the transfer.
 *
 * @throws Will throw an error if the transfer validation fails or if the transfer cannot be completed.
 */
export const transferEthToPolkadot = async <TApi, TRes, TSigner>({
  api,
  provider,
  signer,
  recipient,
  to,
  currency
}: TPjsEvmBuilderOptions<TApi, TRes, TSigner>) => {
  if (Array.isArray(currency)) {
    throw new UnsupportedOperationError('Multi-assets are not yet supported for EVM transfers')
  }

  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    throw new UnsupportedOperationError('Override location is not supported for EVM transfers')
  }

  if (!provider) {
    throw new MissingParameterError(
      'provider',
      'provider parameter is required for Snowbridge transfers.'
    )
  }

  if (!isEthersSigner(signer)) {
    throw new UnsupportedOperationError('Snowbridge does not support Viem provider yet.')
  }

  const ethAsset = findAssetInfoOrThrow('Ethereum', currency, to)

  const amount = abstractDecimals(currency.amount, ethAsset.decimals, api)

  const info = bridgeInfoFor('polkadot_mainnet')
  const environment = createEnvironment(
    info.environment,
    typeof provider === 'string' ? provider : undefined
  )
  const snowbridgeApi = new SnowbridgeApi({
    info: { ...info, environment },
    ethereumProvider: new EthersEthereumProvider()
  })
  if (typeof provider !== 'string') {
    snowbridgeApi.context.setEthProvider(environment.ethChainId, provider)
  }

  const destParaId = getParaId(to)

  assertHasId(ethAsset)

  const sender = snowbridgeApi.sender(
    { kind: 'ethereum', id: environment.ethChainId },
    { kind: 'polkadot', id: destParaId }
  )

  const sourceAddress = await signer.getAddress()

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

  const response = await signer.sendTransaction(transfer.tx)
  const receipt = await response.wait(1)
  if (!receipt) {
    throw new RoutingResolutionError(`Transaction ${response.hash} not included.`)
  }

  const messageReceipt = await sender.messageId(receipt)
  if (!messageReceipt) {
    throw new RoutingResolutionError(`Transaction ${receipt.hash} did not emit a message.`)
  }

  return {
    response,
    messageReceipt
  }
}
