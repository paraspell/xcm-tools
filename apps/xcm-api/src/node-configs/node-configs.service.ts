import { Injectable } from '@nestjs/common';
import {
  NODES_WITH_RELAY_CHAINS,
  TNodeDotKsmWithRelayChains,
  getNodeProviders,
} from '@paraspell/sdk';
import { validateNode } from '../utils.js';

@Injectable()
export class NodeConfigsService {
  getNodeNames() {
    return NODES_WITH_RELAY_CHAINS;
  }

  getWsEndpoints(node: string) {
    validateNode(node, { excludeEthereum: true, withRelayChains: true });
    return getNodeProviders(node as TNodeDotKsmWithRelayChains);
  }
}
