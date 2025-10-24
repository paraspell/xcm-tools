import type { TSubstrateChain } from '@paraspell/sdk';

import acalaPng from '../../logos/acala1.png';
import ajunaPng from '../../logos/ajuna.png';
import assetHubPng from '../../logos/assetHub1.png';
import astarPng from '../../logos/astar1.png';
import bifrostPng from '../../logos/bifrost1.png';
import centrifugePng from '../../logos/centrifuge.png';
import collectivesPng from '../../logos/collectives.png';
import crabPng from '../../logos/crab.png';
import crustPng from '../../logos/crust1.png';
import curioPng from '../../logos/curio.png';
import darwiniaPng from '../../logos/darwinia1.png';
import hydrationPng from '../../logos/hydration1.png';
import interlayPng from '../../logos/interlay.png';
import laosPng from '../../logos/laos.png';
import mantaPng from '../../logos/manta1.png';
import moonbeamPng from '../../logos/moonbeam1.png';
import mythosPng from '../../logos/mythos.png';
import neuroWebPng from '../../logos/neuroWeb1.png';
import nodlePng from '../../logos/nodle1.png';
import pendulumPng from '../../logos/pendulum.png';
import phalaPng from '../../logos/phala1.png';
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

export const getLogoScaleFactor = (chain: TSubstrateChain) => {
  switch (chain) {
    case 'Unique':
    case 'Moonbeam':
    case 'Acala':
      return 2.5;
    case 'BifrostPolkadot':
    case 'Manta':
    case 'Laos':
    case 'Curio':
    case 'Crab':
      return 2;
    case 'Hydration':
    case 'AssetHubPolkadot':
    case 'Astar':
    case 'NeuroWeb':
    case 'Phala':
    case 'Crust':
    case 'Ajuna':
      return 1.75;
    case 'Nodle':
    case 'Mythos':
      return 1.5;
    default:
      return 3;
  }
};
