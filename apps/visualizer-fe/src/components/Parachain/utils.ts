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
import curioPng from '../../logos/curio.png';
import darwiniaPng from '../../logos/darwinia.png';
import hydrationPng from '../../logos/hydration.png';
import interlayPng from '../../logos/interlay.png';
import laosPng from '../../logos/laos.png';
import mantaPng from '../../logos/manta.png';
import moonbeamPng from '../../logos/moonbeam.png';
import mythosPng from '../../logos/mythos.png';
import neuroWebPng from '../../logos/neuroWeb.png';
import nodlePng from '../../logos/nodle.png';
import pendulumPng from '../../logos/pendulum.png';
import phalaPng from '../../logos/phala.png';
import uniquePng from '../../logos/unique.png';
import zeitgeistPng from '../../logos/zeitgeist.png';
import { getParachainLogo } from '../../utils/utils';

export const getChainLogo = (chain: TSubstrateChain) => {
  switch (chain) {
    case 'Collectives':
      return collectivesPng;
    case 'Interlay':
      return interlayPng;
    case 'Centrifuge':
      return centrifugePng;
    case 'Zeitgeist':
      return zeitgeistPng;
    case 'Unique':
      return uniquePng;
    case 'Acala':
      return acalaPng;
    case 'Pendulum':
      return pendulumPng;
    case 'Manta':
      return mantaPng;
    case 'Moonbeam':
      return moonbeamPng;
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
    case 'Phala':
      return phalaPng;
    case 'Crust':
      return crustPng;
    case 'Nodle':
      return nodlePng;
    case 'Darwinia':
      return darwiniaPng;
    case 'Ajuna':
      return ajunaPng;
    case 'Laos':
      return laosPng;
    case 'Mythos':
      return mythosPng;
    case 'Curio':
      return curioPng;
    case 'Crab':
      return crabPng;
    default:
      return getParachainLogo(chain);
  }
};
