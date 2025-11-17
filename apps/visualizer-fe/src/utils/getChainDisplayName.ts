import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';

export const getChainDisplayName = (parachain: string) =>
  parachain
    .replace(/(?<=[a-z0-9])(?=[A-Z])/g, ' ')
    .replace(/(?<=[A-Z])(?=[A-Z][a-z])/g, ' ')
    .trim();

export const getChainNameNoEcosystem = (parachain: TSubstrateChain, ecosystem: TRelaychain) => {
  if (parachain === ecosystem) return parachain;

  const end = parachain.endsWith(ecosystem);
  if (!end) return parachain;

  const base = parachain.slice(0, -ecosystem.length);
  return getChainDisplayName(base);
};
