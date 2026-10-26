import type { TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertEthereumBridgePair,
  assertHasId,
  DEFAULT_TTL_MS,
  findAssetInfoOrThrow,
  getParaId,
  RoutingResolutionError,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import { SnowbridgeApi, toPolkadotV2 } from '@snowbridge/api'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { PublicClient, TransactionSerializableEIP1559 } from 'viem'

import { createEnvironment } from './createEnvironment'
import { ethereumWsUrlsFor, snowbridgeEnvironmentFor } from './snowbridgeEnvironment'
import { leaseClient, releaseClient } from './viemClientCache'

export const buildSnowbridgeTransfer = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  {
    api,
    to,
    currency,
    recipient,
    sender: senderAddress,
    from = 'Ethereum'
  }: TBuildEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  client?: PublicClient
) => {
  if (Array.isArray(currency)) {
    throw new UnsupportedOperationError(
      'Multi-assets are not yet supported for Snowbridge transfers'
    )
  }

  assertEthereumBridgePair(from, to)
  const environmentName = snowbridgeEnvironmentFor(from, to)

  const ethAsset = findAssetInfoOrThrow(from, currency, to)
  const amount = abstractDecimals(currency.amount, ethAsset.decimals, api)

  const info = bridgeInfoFor(environmentName)
  const environment = createEnvironment(info.environment)
  const snowbridgeApi = new SnowbridgeApi({
    info: { ...info, environment },
    ethereumProvider: new ViemEthereumProvider()
  })

  const wsUrls = ethereumWsUrlsFor(environmentName)
  const publicClient = client ?? (await leaseClient(wsUrls, DEFAULT_TTL_MS))

  snowbridgeApi.context.setEthProvider(environment.ethChainId, publicClient)

  const destParaId = getParaId(to)
  assertHasId(ethAsset)

  const sender = snowbridgeApi.sender(
    { kind: 'ethereum', id: environment.ethChainId },
    { kind: 'polkadot', id: destParaId }
  )

  const fee = await sender.fee(ethAsset.assetId)
  const transfer = await sender.tx(senderAddress, recipient, ethAsset.assetId, amount, fee)
  const validated = await sender.validate(transfer)

  if (validated.logs.find(l => l.kind === toPolkadotV2.ValidationKind.Error)) {
    throw new RoutingResolutionError(
      `Validation failed with following errors: \n\n ${validated.logs
        .filter(l => l.kind === toPolkadotV2.ValidationKind.Error)
        .map(l => l.message)
        .join('\n\n')}`
    )
  }

  const { to: txTo, data, value } = transfer.tx

  const tx: TransactionSerializableEIP1559 = {
    type: 'eip1559',
    to: txTo,
    data,
    value: value ?? 0n,
    chainId: environment.ethChainId
  }

  if (!client) releaseClient(wsUrls)

  return {
    tx,
    sender
  }
}
