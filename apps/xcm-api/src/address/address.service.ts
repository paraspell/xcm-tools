import { Injectable } from '@nestjs/common';
import { convertSs58, SUBSTRATE_CHAINS, TSubstrateChain } from '@paraspell/sdk';

import { validateChain } from '../utils.js';

@Injectable()
export class AddressService {
  convertSs58(address: string, chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return convertSs58(address, chain as TSubstrateChain);
  }
}
