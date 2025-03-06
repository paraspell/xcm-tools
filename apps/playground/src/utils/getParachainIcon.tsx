import type { TNodeWithRelayChains } from '@paraspell/sdk';
import { determineRelayChain, getParaId } from '@paraspell/sdk';
import {
  prodRelayKusama,
  prodRelayPolkadot,
} from '@polkadot/apps-config/endpoints';

export const getParachainIcon = (node?: TNodeWithRelayChains) => {
  if (!node) {
    return null;
  }

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
