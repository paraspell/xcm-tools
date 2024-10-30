import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
} from '@paraspell/sdk';
import { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import { ApiPromise } from '@polkadot/api';
import { PolkadotClient } from 'polkadot-api';

@Injectable()
export class BalanceService {
  async getBalanceNativePjs(node: string, params: BalanceNativeDto) {
    return await this.getBalanceNative(node, params);
  }

  async getBalanceNativePapi(node: string, params: BalanceNativeDto) {
    return await this.getBalanceNative(node, params, true);
  }

  private async getBalanceNative(
    node: string,
    { address }: BalanceNativeDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk/papi')
      : await import('@paraspell/sdk');

    const api = await Sdk.createApiInstanceForNode(nodeTyped);
    const balance = await Sdk.getBalanceNative({
      address,
      node: nodeTyped,
      api: api as ApiPromise & PolkadotClient,
    });
    if ('disconnect' in api) await api.disconnect();
    else api.destroy();
    return balance;
  }

  async getBalanceForeignPjs(node: string, params: BalanceForeignDto) {
    return await this.getBalanceForeign(node, params);
  }

  async getBalanceForeignPapi(node: string, params: BalanceForeignDto) {
    return await this.getBalanceForeign(node, params, true);
  }

  private async getBalanceForeign(
    node: string,
    { address, currency }: BalanceForeignDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodePolkadotKusama;
    if (!NODE_NAMES_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk/papi')
      : await import('@paraspell/sdk');

    const api = await Sdk.createApiInstanceForNode(nodeTyped);
    const balance = await Sdk.getBalanceForeign({
      address,
      currency,
      node: nodeTyped,
      api: api as ApiPromise & PolkadotClient,
    });
    if ('disconnect' in api) await api.disconnect();
    else api.destroy();
    return balance === null ? 'null' : balance.toString();
  }
}
