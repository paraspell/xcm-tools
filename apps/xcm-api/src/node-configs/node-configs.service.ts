import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NODES_WITH_RELAY_CHAINS,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  getNodeProviders,
  getParaId,
  getTNode,
} from '@paraspell/sdk';
import { validateNode } from '../utils.js';

@Injectable()
export class NodeConfigsService {
  getNodeNames() {
    return NODES_WITH_RELAY_CHAINS;
  }

  getParaId(node: string) {
    validateNode(node, { excludeEthereum: true });
    return getParaId(node as TNodePolkadotKusama);
  }

  getNodeByParaId(paraId: number, ecosystem: string | undefined) {
    if (ecosystem !== 'polkadot' && ecosystem !== 'kusama') {
      throw new BadRequestException(
        "Invalid ecosystem provided. Available options are 'polkadot' and 'kusama'.",
      );
    }
    const node = getTNode(paraId, ecosystem);
    if (!node) {
      throw new NotFoundException(
        `Node with parachain id ${paraId} not found.`,
      );
    }
    return JSON.stringify(node);
  }

  getWsEndpoints(node: string) {
    validateNode(node, { excludeEthereum: true, withRelayChains: true });
    return getNodeProviders(node as TNodeDotKsmWithRelayChains);
  }
}
