import { Injectable } from '@nestjs/common';
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
  getPalletIndex,
  getSupportedPallets,
  TSubstrateChain,
} from '@paraspell/sdk';

import { validatePallet } from './utils/index.js';

@Injectable()
export class PalletsService {
  getDefaultPallet(chain: TSubstrateChain) {
    return JSON.stringify(getDefaultPallet(chain));
  }

  getPallets(chain: TSubstrateChain) {
    return getSupportedPallets(chain);
  }

  getNativeAssetsPallet(chain: TSubstrateChain) {
    return JSON.stringify(getNativeAssetsPallet(chain));
  }

  getOtherAssetsPallets(chain: TSubstrateChain) {
    return getOtherAssetsPallets(chain);
  }

  getPalletIndex(chain: TSubstrateChain, pallet: string) {
    const palletTyped = validatePallet(pallet);
    const index = getPalletIndex(chain, palletTyped);
    return index === undefined ? null : index;
  }
}
