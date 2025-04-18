import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getAssetBalance,
  getBalanceForeign,
  getBalanceNative,
  getExistentialDeposit,
  getMaxForeignTransferableAmount,
  getMaxNativeTransferableAmount,
  getTransferableAmount,
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
  verifyEdOnDestination,
} from '@paraspell/sdk';

import { handleXcmApiError } from '../utils/error-handler.js';
import { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';
import { VerifyEdOnDestDto } from './dto/VerifyEdOnDestDto.js';

@Injectable()
export class BalanceService {
  getBalanceNative(node: string, { address, currency }: BalanceNativeDto) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    return getBalanceNative({
      address,
      node: nodeTyped,
      currency,
    });
  }

  async getBalanceForeign(
    node: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const nodeTyped = node as TNodePolkadotKusama;
    if (!NODE_NAMES_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    try {
      const balance = await getBalanceForeign({
        address,
        currency,
        node: nodeTyped,
      });
      return balance === null ? 'null' : balance.toString();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getAssetBalance(
    node: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const nodeTyped = node as TNodePolkadotKusama;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    const balance = await getAssetBalance({
      address,
      currency,
      node: nodeTyped,
    });
    return balance === null ? 'null' : balance.toString();
  }

  getMaxNativeTransferableAmount(
    node: string,
    { address, currency }: BalanceNativeDto,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    return getMaxNativeTransferableAmount({
      address,
      node: nodeTyped,
      currency,
    });
  }

  getMaxForeignTransferableAmount(
    node: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const nodeTyped = node as TNodePolkadotKusama;
    if (!NODE_NAMES_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    return getMaxForeignTransferableAmount({
      address,
      currency,
      node: nodeTyped,
    });
  }

  getTransferableAmount(
    node: string,
    { address, currency }: BalanceForeignDto,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    return getTransferableAmount({
      address,
      currency,
      node: nodeTyped,
    });
  }

  getExistentialDeposit(node: string, { currency }: ExistentialDepositDto) {
    const nodeTyped = node as TNodeWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    return getExistentialDeposit(nodeTyped, currency);
  }

  verifyEdOnDestination(
    node: string,
    { address, currency }: VerifyEdOnDestDto,
  ) {
    const nodeTyped = node as TNodeDotKsmWithRelayChains;
    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(nodeTyped)) {
      throw new BadRequestException(
        `Node ${node} is not valid. Check docs for valid nodes.`,
      );
    }

    return verifyEdOnDestination({
      node: nodeTyped,
      address,
      currency,
    });
  }
}
