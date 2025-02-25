import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';
import { VerifyEdOnDestDto } from './dto/VerifyEdOnDestDto.js';

@Injectable()
export class BalanceService {
  async getBalanceNative(
    node: string,
    { address, currency }: BalanceNativeDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    return await Sdk.getBalanceNative({
      address,
      node: nodeTyped,
      currency,
    });
  }

  async getBalanceForeign(
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
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    const balance = await Sdk.getBalanceForeign({
      address,
      currency,
      node: nodeTyped,
    });
    return balance === null ? 'null' : balance.toString();
  }

  async getAssetBalance(
    node: string,
    { address, currency }: BalanceForeignDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodePolkadotKusama;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    const balance = await Sdk.getAssetBalance({
      address,
      currency,
      node: nodeTyped,
    });
    return balance === null ? 'null' : balance.toString();
  }

  async getMaxNativeTransferableAmount(
    node: string,
    { address, currency }: BalanceNativeDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    const balance = await Sdk.getMaxNativeTransferableAmount({
      address,
      node: nodeTyped,
      currency,
    });
    return balance;
  }

  async getMaxForeignTransferableAmount(
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
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    const balance = await Sdk.getMaxForeignTransferableAmount({
      address,
      currency,
      node: nodeTyped,
    });
    return balance;
  }

  async getTransferableAmount(
    node: string,
    { address, currency }: BalanceForeignDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    return await Sdk.getTransferableAmount({
      address,
      currency,
      node: nodeTyped,
    });
  }

  async getExistentialDeposit(
    node: string,
    { currency }: ExistentialDepositDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodeWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    return Sdk.getExistentialDeposit(nodeTyped, currency);
  }

  async verifyEdOnDestination(
    node: string,
    { address, currency }: VerifyEdOnDestDto,
    usePapi = false,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    return Sdk.verifyEdOnDestination({
      node: nodeTyped,
      address,
      currency,
    });
  }
}
