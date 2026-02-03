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
import { toPolkadotV2 } from '@snowbridge/api'
import { assetRegistryFor, environmentFor } from '@snowbridge/registry'

import type { TPjsEvmBuilderOptions } from '../types'
import { isEthersSigner } from '../utils'
import { createContext } from './createContext'

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
  address,
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

  const env = environmentFor('polkadot_mainnet')
  const context = createContext(provider, env)

  const destParaId = getParaId(to)

  assertHasId(ethAsset)

  const registry = assetRegistryFor('polkadot_mainnet')

  const fee = await toPolkadotV2.getDeliveryFee(
    {
      gateway: context.gateway(),
      assetHub: await context.assetHub(),
      destination: await context.parachain(destParaId)
    },
    registry,
    ethAsset.assetId,
    destParaId
  )

  const sourceAddress = await signer.getAddress()

  const transfer = await toPolkadotV2.createTransfer(
    registry,
    sourceAddress,
    address,
    ethAsset.assetId,
    destParaId,
    amount,
    fee
  )

  const validation = await toPolkadotV2.validateTransfer(
    {
      ethereum: context.ethereum(),
      gateway: context.gateway(),
      bridgeHub: await context.bridgeHub(),
      assetHub: await context.assetHub(),
      destParachain:
        destParaId !== getParaId('AssetHubPolkadot')
          ? await context.parachain(destParaId)
          : undefined
    },
    transfer
  )

  if (validation.logs.find(l => l.kind == toPolkadotV2.ValidationKind.Error)) {
    throw new RoutingResolutionError(
      `Validation failed with following errors: \n\n ${validation.logs
        .filter(l => l.kind == toPolkadotV2.ValidationKind.Error)
        .map(l => l.message)
        .join('\n\n')}`
    )
  }

  const { tx } = transfer

  const response = await signer.sendTransaction(tx)
  const receipt = await response.wait(1)
  if (!receipt) {
    throw new RoutingResolutionError(`Transaction ${response.hash} not included.`)
  }

  const messageReceipt = await toPolkadotV2.getMessageReceipt(receipt)
  if (!messageReceipt) {
    throw new RoutingResolutionError(`Transaction ${receipt.hash} did not emit a message.`)
  }

  return {
    response,
    messageReceipt
  }
}
