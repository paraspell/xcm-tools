import { Injectable } from '@nestjs/common';
import { convertSs58, TNodeDotKsmWithRelayChains } from '@paraspell/sdk';

import { validateNode } from '../utils.js';

@Injectable()
export class AddressService {
  convertSs58(address: string, node: string) {
    validateNode(node, {
      excludeEthereum: true,
      withRelayChains: true,
    });
    return convertSs58(address, node as TNodeDotKsmWithRelayChains);
  }
}
