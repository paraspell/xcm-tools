import { Ecosystem } from '../../../types/types';
import polkadotPng from '../../../logos/polkadot1.png';
import kusamaPng from '../../../logos/kusama.png';
import westendPng from '../../../logos/westend.png';
import rococoPng from '../../../logos/rococo.png';

export const getRelaychainLogo = (ecosystem: Ecosystem) => {
  switch (ecosystem) {
    case Ecosystem.POLKADOT:
      return polkadotPng;
    case Ecosystem.KUSAMA:
      return kusamaPng;
    case Ecosystem.WESTEND:
      return westendPng;
    case Ecosystem.ROCOCO:
      return rococoPng;
  }
};
