import { BadRequestException, Injectable } from '@nestjs/common';
import { convertSs58, SUBSTRATE_CHAINS, TSubstrateChain } from '@paraspell/sdk';

import { isValidPolkadotAddress, validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';

@Injectable()
export class AddressService {
  convertSs58(address: string, chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    // Ensure invalid addresses are always a 400, not a 500 bubbling from downstream code.
    if (!isValidPolkadotAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }
    try {
      return convertSs58(address, chain as TSubstrateChain);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
