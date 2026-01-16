import type { TChain } from '@paraspell/sdk';
import { getParaId, getRelayChainOf, isExternalChain } from '@paraspell/sdk';
import {
  prodRelayKusama,
  prodRelayPolkadot,
  testRelayPaseo,
  testRelayWestend,
} from '@polkadot/apps-config/endpoints';

export const getParachainIcon = (chain?: TChain) => {
  if (!chain) {
    return null;
  }

  if (chain === 'Polkadot') {
    return prodRelayPolkadot.ui.logo;
  }

  if (chain === 'Kusama') {
    return prodRelayKusama.ui.logo;
  }

  if (chain === 'Westend') {
    return testRelayWestend.ui.logo;
  }

  if (chain === 'Paseo') {
    return testRelayPaseo.ui.logo;
  }

  if (isExternalChain(chain)) {
    return '/ethereum.svg';
  }

  const paraId = getParaId(chain);
  const ecosystem = getRelayChainOf(chain);

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
