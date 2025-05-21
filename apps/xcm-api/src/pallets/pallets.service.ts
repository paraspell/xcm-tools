import { Injectable } from '@nestjs/common';
import {
  getDefaultPallet,
  getPalletIndex,
  getSupportedPallets,
  TNodePolkadotKusama,
} from '@paraspell/sdk';

import { validateNode } from '../utils.js';
import { validatePallet } from './utils/index.js';

@Injectable()
export class PalletsService {
  getDefaultPallet(node: string) {
    validateNode(node);
    return JSON.stringify(getDefaultPallet(node as TNodePolkadotKusama));
  }

  getPallets(node: string) {
    validateNode(node);
    return getSupportedPallets(node as TNodePolkadotKusama);
  }

  getPalletIndex(node: string, pallet: string) {
    validateNode(node);
    const palletTyped = validatePallet(pallet);
    const index = getPalletIndex(node as TNodePolkadotKusama, palletTyped);
    return index === undefined ? null : index;
  }
}
