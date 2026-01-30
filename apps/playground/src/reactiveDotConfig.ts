import { defineConfig } from '@reactive-dot/core';
import { InjectedWalletProvider } from '@reactive-dot/core/wallets.js';
import { LedgerWallet } from '@reactive-dot/wallet-ledger';
import { MimirWalletProvider } from '@reactive-dot/wallet-mimir';

export const config = defineConfig({
  chains: {},
  includeEvmAccounts: true,
  wallets: [
    new InjectedWalletProvider(),
    new LedgerWallet(),
    new MimirWalletProvider(),
  ],
});
