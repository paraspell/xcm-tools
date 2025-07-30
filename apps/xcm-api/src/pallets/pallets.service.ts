import { Injectable } from '@nestjs/common';
import {
  getDefaultPallet,
  getPalletIndex,
  getSupportedPallets,
  SUBSTRATE_CHAINS,
  TSubstrateChain,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { validatePallet } from './utils/index.js';

@Injectable()
export class PalletsService {
  getDefaultPallet(chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return JSON.stringify(getDefaultPallet(chain as TSubstrateChain));
  }

  getPallets(chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return getSupportedPallets(chain as TSubstrateChain);
  }

  getPalletIndex(chain: string, pallet: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    const palletTyped = validatePallet(pallet);
    const index = getPalletIndex(chain as TSubstrateChain, palletTyped);
    return index === undefined ? null : index;
  }
}
