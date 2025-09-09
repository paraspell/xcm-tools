import kusamaPng from '../../../logos/kusama.png';
import paseoPng from '../../../logos/paseo.png';
import polkadotPng from '../../../logos/polkadot1.png';
import westendPng from '../../../logos/westend.png';
import { Ecosystem } from '../../../types/types';

export const getRelaychainLogo = (ecosystem: Ecosystem) => {
  switch (ecosystem) {
    case Ecosystem.POLKADOT:
      return polkadotPng;
    case Ecosystem.KUSAMA:
      return kusamaPng;
    case Ecosystem.WESTEND:
      return westendPng;
    case Ecosystem.PASEO:
      return paseoPng;
  }
};
