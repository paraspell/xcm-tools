import { defineConfig } from '@reactive-dot/core';
import {
  InjectedWalletProvider,
  type WalletProvider,
} from '@reactive-dot/core/wallets.js';
import { LedgerWallet } from '@reactive-dot/wallet-ledger';
import { MimirWalletProvider } from '@reactive-dot/wallet-mimir';

export const config = defineConfig({
  chains: {},
  includeEvmAccounts: true,
  wallets: [
    new InjectedWalletProvider(),
    new LedgerWallet(),
    /* Due to bug inside reactive-dot library: MimirWallet’s private #mimir class field makes it incompatible with
    reactive-dot’s Wallet type, so TypeScript rejects MimirWalletProvider even though it works at runtime.
    Cast required until the library types are fixed. */
    new MimirWalletProvider() as unknown as WalletProvider,
  ],
});
