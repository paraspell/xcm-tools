import { Injectable } from '@nestjs/common';
import { convertSs58, TChainDotKsmWithRelayChains } from '@paraspell/sdk';

import { validateChain } from '../utils.js';

@Injectable()
export class AddressService {
  convertSs58(address: string, chain: string) {
    validateChain(chain, {
      excludeEthereum: true,
      withRelayChains: true,
    });
    return convertSs58(address, chain as TChainDotKsmWithRelayChains);
  }
}
