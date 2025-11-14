import type { TRelaychain } from '@paraspell/sdk';

import kusamaPng from '../../../logos/kusama.png';
import paseoPng from '../../../logos/paseo.png';
import polkadotPng from '../../../logos/polkadot.png';
import westendPng from '../../../logos/westend.png';

export const getRelaychainLogo = (ecosystem: TRelaychain) => {
  switch (ecosystem) {
    case 'Polkadot':
      return polkadotPng;
    case 'Kusama':
      return kusamaPng;
    case 'Westend':
      return westendPng;
    case 'Paseo':
      return paseoPng;
  }
};
