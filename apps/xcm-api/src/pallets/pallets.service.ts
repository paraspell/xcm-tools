import { Injectable } from '@nestjs/common';
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
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

  getNativeAssetsPallet(chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return JSON.stringify(getNativeAssetsPallet(chain as TSubstrateChain));
  }

  getOtherAssetsPallets(chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return getOtherAssetsPallets(chain as TSubstrateChain);
  }

  getPalletIndex(chain: string, pallet: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    const palletTyped = validatePallet(pallet);
    const index = getPalletIndex(chain as TSubstrateChain, palletTyped);
    return index === undefined ? null : index;
  }
}
