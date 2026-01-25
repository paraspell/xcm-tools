import { Injectable } from '@nestjs/common';
import { convertSs58, SUBSTRATE_CHAINS, TSubstrateChain } from '@paraspell/sdk';

import { validateChain } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';

@Injectable()
export class AddressService {
  convertSs58(address: string, chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    try {
      return convertSs58(address, chain as TSubstrateChain);
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
