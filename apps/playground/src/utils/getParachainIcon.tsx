import type { TNodeWithRelayChains } from '@paraspell/sdk';
import { getParaId, determineRelayChain } from '@paraspell/sdk';
import {
  prodRelayPolkadot,
  prodRelayKusama,
} from '@polkadot/apps-config/endpoints';

export const getParachainIcon = (node: TNodeWithRelayChains) => {
  if (node === 'Polkadot') {
    return prodRelayPolkadot.ui.logo;
  }

  if (node === 'Kusama') {
    return prodRelayKusama.ui.logo;
  }

  if (node === 'Ethereum') {
    return '/ethereum.svg';
  }

  const paraId = getParaId(node);
  const ecosystem = determineRelayChain(node);

  const relay = ecosystem === 'Polkadot' ? prodRelayPolkadot : prodRelayKusama;
  const logo = relay.linked?.find((item) => item.paraId === paraId)?.ui.logo;

  return logo === undefined || logo.startsWith('fa;') ? '/circle.svg' : logo;
};
