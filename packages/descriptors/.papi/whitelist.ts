import type { WhitelistEntriesByChain } from './descriptors'

export const whitelist: WhitelistEntriesByChain = {
  ahp: [
    'tx.PolkadotXcm.*',
    'tx.Utility.*',
    'api.DryRunApi.*',
    'api.XcmPaymentApi.*',
    'api.AssetConversionApi.*'
  ],
  bridgeHub: ['query.EthereumOutboundQueue.OperatingMode'],
  hydration: ['query.MultiTransactionPayment.AccountCurrencyMap'],
  moonbeam: ['query.EVM.AccountStorages']
}
