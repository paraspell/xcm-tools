import { BadRequestException, Injectable } from '@nestjs/common';
import {
  createApiInstanceForNode,
  getBalanceForeign,
  getBalanceNative,
  NODES_WITH_RELAY_CHAINS,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';

@Injectable()
export class BalanceService {
  async getBalanceNative(node: string, { address }: BalanceNativeDto) {
    const nodeTyped = node as TNodeWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }
    const api = await createApiInstanceForNode(nodeTyped);
    const balance = await getBalanceNative(address, nodeTyped, api);
    await api.disconnect();
    return balance;
  }

  async getBalanceForeign(
    node: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const nodeTyped = node as TNodePolkadotKusama;
    if (!NODES_WITH_RELAY_CHAINS.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }
    const api = await createApiInstanceForNode(nodeTyped);
    const balance = await getBalanceForeign(address, nodeTyped, currency, api);
    await api.disconnect();
    return balance === null ? 'null' : balance.toString();
  }
}
