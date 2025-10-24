import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import {
  getParaId,
  getRelayChainOf,
  getTChain,
  isExternalChain,
  SUBSTRATE_CHAINS
} from '@paraspell/sdk';
import {
  prodRelayKusama,
  prodRelayPolkadot,
  testRelayPaseo,
  testRelayWestend
} from '@polkadot/apps-config/endpoints';

export const getParachainId = (parachain: TSubstrateChain): number => {
  return getParaId(parachain);
};

export const getParachainById = (id: number, ecosystem: TRelaychain): TSubstrateChain | null => {
  const chain = getTChain(id, ecosystem);
  if (!chain || isExternalChain(chain)) return null;
  return chain;
};

export const getParachainEcosystem = (parachain: TSubstrateChain): TRelaychain =>
  getRelayChainOf(parachain);

export const getParachainColor = (parachain: TSubstrateChain, ecosystem?: TRelaychain): string => {
  if (ecosystem && parachain === ecosystem) return 'blue.6';
  return findEndpointOption(getParachainEcosystem(parachain), parachain)?.ui.color ?? 'gray.6';
};

export const getParachainLogo = (
  parachain: TSubstrateChain,
  ecosystem?: TRelaychain
): string | undefined => {
  const paraId = getParaId(parachain);
  const e = ecosystem ?? getRelayChainOf(parachain);
  const logo = getFilteredEndpointOptions(e)?.find(chain => chain.paraId === paraId)?.ui.logo;
  return logo?.startsWith('fa;') ? undefined : logo;
};

export const getChainsByEcosystem = (ecosystem: TRelaychain) =>
  SUBSTRATE_CHAINS.filter(chain => getRelayChainOf(chain) === ecosystem && chain !== ecosystem);

const findEndpointOption = (ecosystem: TRelaychain, parachain: TSubstrateChain) => {
  return getFilteredEndpointOptions(ecosystem)?.find(chain => chain.text === parachain);
};

export const getFilteredEndpointOptions = (ecosystem: TRelaychain) => {
  return getEndpointOptions(ecosystem)?.filter(({ providers, isUnreachable }) => {
    const hasProviders = Object.keys(providers).length !== 0;
    return hasProviders && !isUnreachable;
  });
};

const getEndpointOptions = (ecosystem: TRelaychain) => {
  switch (ecosystem) {
    case 'Polkadot':
      return prodRelayPolkadot.linked;
    case 'Kusama':
      return prodRelayKusama.linked;
    case 'Westend':
      return testRelayWestend.linked;
    case 'Paseo':
      return testRelayPaseo.linked;
  }
};
