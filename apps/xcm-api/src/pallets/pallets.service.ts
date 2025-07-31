import { Injectable } from '@nestjs/common';
import {
  getDefaultPallet,
  getPalletIndex,
  getSupportedPallets,
  TChainPolkadotKusama,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { validatePallet } from './utils/index.js';

@Injectable()
export class PalletsService {
  getDefaultPallet(chain: string) {
    validateChain(chain);
    return JSON.stringify(getDefaultPallet(chain as TChainPolkadotKusama));
  }

  getPallets(chain: string) {
    validateChain(chain);
    return getSupportedPallets(chain as TChainPolkadotKusama);
  }

  getPalletIndex(chain: string, pallet: string) {
    validateChain(chain);
    const palletTyped = validatePallet(pallet);
    const index = getPalletIndex(chain as TChainPolkadotKusama, palletTyped);
    return index === undefined ? null : index;
  }
}
