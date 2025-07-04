import type { TNodeWithRelayChains } from '@paraspell/sdk';
import { getParaId, getRelayChainOf } from '@paraspell/sdk';
import {
  prodRelayKusama,
  prodRelayPolkadot,
  testRelayPaseo,
  testRelayWestend,
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

  if (node === 'Westend') {
    return testRelayWestend.ui.logo;
  }

  if (node === 'Paseo') {
    return testRelayPaseo.ui.logo;
  }

  if (node === 'Ethereum') {
    return '/ethereum.svg';
  }

  const paraId = getParaId(node);
  const ecosystem = getRelayChainOf(node);

  let relay;
  switch (ecosystem) {
    case 'Polkadot':
      relay = prodRelayPolkadot;
      break;
    case 'Kusama':
      relay = prodRelayKusama;
      break;
    case 'Westend':
      relay = testRelayWestend;
      break;
    case 'Paseo':
      relay = testRelayPaseo;
      break;
    default:
      return '/circle.svg';
  }

  const logo = relay.linked?.find((item) => item.paraId === paraId)?.ui.logo;

  return logo === undefined || logo.startsWith('fa;') ? '/circle.svg' : logo;
};
