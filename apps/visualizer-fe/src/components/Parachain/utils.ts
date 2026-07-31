import type { TSubstrateChain } from '@paraspell/sdk';

import acalaPng from '../../logos/acala.png';
import ajunaPng from '../../logos/ajuna.png';
import assetHubPng from '../../logos/assetHub.png';
import astarPng from '../../logos/astar.png';
import bifrostPng from '../../logos/bifrost.png';
import centrifugePng from '../../logos/centrifuge.png';
import collectivesPng from '../../logos/collectives.png';
import crabPng from '../../logos/crab.png';
import crustPng from '../../logos/crust.png';
import darwiniaPng from '../../logos/darwinia.png';
import hydrationPng from '../../logos/hydration.png';
import mythosPng from '../../logos/mythos.png';
import neuroWebPng from '../../logos/neuroWeb.png';
import pendulumPng from '../../logos/pendulum.png';
import uniquePng from '../../logos/unique.png';
import { getParachainLogo } from '../../utils/utils';

export const getChainLogo = (chain: TSubstrateChain) => {
  switch (chain) {
    case 'Collectives':
      return collectivesPng;
    case 'Centrifuge':
      return centrifugePng;
    case 'Unique':
      return uniquePng;
    case 'Acala':
      return acalaPng;
    case 'Pendulum':
      return pendulumPng;
    case 'BifrostPolkadot':
      return bifrostPng;
    case 'Hydration':
      return hydrationPng;
    case 'AssetHubPolkadot':
      return assetHubPng;
    case 'Astar':
      return astarPng;
    case 'NeuroWeb':
      return neuroWebPng;
    case 'Crust':
      return crustPng;
    case 'Darwinia':
      return darwiniaPng;
    case 'Ajuna':
      return ajunaPng;
    case 'Mythos':
      return mythosPng;
    case 'Crab':
      return crabPng;
    default:
      return getParachainLogo(chain);
  }
};
