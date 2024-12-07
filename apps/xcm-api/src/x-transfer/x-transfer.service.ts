import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { isValidWalletAddress } from '../utils.js';
import { XTransferDto } from './dto/XTransferDto.js';
import { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import {
  IncompatibleNodesError,
  InvalidCurrencyError,
  NODE_NAMES,
  NODE_NAMES_DOT_KSM,
  TNodePolkadotKusama,
  TNode,
} from '@paraspell/sdk';
import type * as SdkType from '@paraspell/sdk';
import type * as SdkPapiType from '@paraspell/sdk/papi';
import { determineRelayChain } from '@paraspell/sdk';
import { ApiPromise } from '@polkadot/api';
import { PolkadotClient } from 'polkadot-api';
import { TPapiTransaction } from '@paraspell/sdk/papi';

@Injectable()
export class XTransferService {
  async generateXcmCall(
    {
      from,
      to,
      amount,
      address,
      ahAddress,
      currency,
      xcmVersion,
    }: XTransferDto,
    usePapi = false,
  ) {
    const fromNode = from as TNodePolkadotKusama | undefined;
    const toNode = to as TNode | undefined;

    if (!fromNode && !toNode) {
      throw new BadRequestException(
        "You need to provide either 'from' or 'to' parameters",
      );
    }

    if (fromNode && !NODE_NAMES_DOT_KSM.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${fromNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (typeof toNode === 'string' && toNode && !NODE_NAMES.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (fromNode && toNode && !currency) {
      throw new BadRequestException(`Currency should not be empty.`);
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    if (fromNode === 'Hydration' && toNode === 'Ethereum' && !ahAddress) {
      throw new BadRequestException(
        'AssetHub address is required when transferring from Hydration to Ethereum.',
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk/papi')
      : await import('@paraspell/sdk');

    const node = !fromNode
      ? determineRelayChain(toNode as TNodePolkadotKusama)
      : fromNode;
    const api = await Sdk.createApiInstanceForNode(node as TNodePolkadotKusama);

    const builder = Sdk.Builder(api as PolkadotClient & ApiPromise);

    let finalBuilder:
      | SdkPapiType.UseKeepAliveFinalBuilder
      | SdkType.UseKeepAliveFinalBuilder;

    if (fromNode && toNode && currency) {
      // Parachain to parachain
      finalBuilder = builder
        .from(fromNode)
        .to(toNode)
        .currency(currency)
        .amount(amount)
        .address(address, ahAddress);
    } else if (fromNode) {
      // Parachain to relaychain
      finalBuilder = builder.from(fromNode).amount(amount).address(address);
    } else {
      // Relaychain to parachain
      finalBuilder = builder
        .to(toNode as TNodePolkadotKusama)
        .amount(amount)
        .address(address);
    }

    if (xcmVersion) {
      finalBuilder = finalBuilder.xcmVersion(xcmVersion);
    }

    try {
      if (usePapi) {
        const tx = await finalBuilder.build();
        return (await (tx as TPapiTransaction).getEncodedData()).asHex();
      }

      return await finalBuilder.build();
    } catch (e) {
      if (
        e instanceof InvalidCurrencyError ||
        e instanceof IncompatibleNodesError
      ) {
        console.log(e);
        throw new BadRequestException(e.message);
      }
      const error = e as Error;
      throw new InternalServerErrorException(error.message);
    } finally {
      if ('disconnect' in api) await api.disconnect();
      else api.destroy();
    }
  }

  async generateBatchXcmCall(batchDto: BatchXTransferDto, usePapi = false) {
    const { transfers, options } = batchDto;

    if (!transfers || transfers.length === 0) {
      throw new BadRequestException('Transfers array cannot be empty.');
    }

    const firstTransfer = transfers[0];
    const fromNode = firstTransfer.from as TNodePolkadotKusama | undefined;
    const toNode = firstTransfer.to as TNode | undefined;

    if (!fromNode && !toNode) {
      throw new BadRequestException(
        "You need to provide either 'from' or 'to' parameters.",
      );
    }

    if (toNode && typeof toNode === 'object') {
      throw new BadRequestException('Please provide ApiPromise instance.');
    }

    const sameFrom = transfers.every((transfer) => transfer.from === fromNode);

    if (!sameFrom) {
      throw new BadRequestException(
        'All transactions must have the same origin.',
      );
    }

    if (fromNode && !NODE_NAMES_DOT_KSM.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${fromNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (toNode && !NODE_NAMES.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk/papi')
      : await import('@paraspell/sdk');

    const api = await Sdk.createApiInstanceForNode(
      fromNode ?? determineRelayChain(toNode as TNodePolkadotKusama),
    );
    let builder = Sdk.Builder(api as PolkadotClient & ApiPromise);

    try {
      for (const transfer of transfers) {
        const transferFromNode = transfer.from as
          | TNodePolkadotKusama
          | undefined;
        const transferToNode = transfer.to as TNodePolkadotKusama | undefined;

        if (
          transferToNode &&
          typeof transferToNode === 'string' &&
          !NODE_NAMES.includes(transferToNode)
        ) {
          throw new BadRequestException(
            `Node ${transferToNode} is not valid. Check docs for valid nodes.`,
          );
        }

        if (transferFromNode && transferToNode && !transfer.currency) {
          throw new BadRequestException('Currency should not be empty.');
        }

        if (
          typeof transfer.address === 'string' &&
          !isValidWalletAddress(transfer.address)
        ) {
          throw new BadRequestException('Invalid wallet address.');
        }

        let finalBuilder:
          | SdkPapiType.UseKeepAliveFinalBuilder
          | SdkType.UseKeepAliveFinalBuilder;

        if (transferFromNode && transferToNode && transfer.currency) {
          // Parachain to parachain
          finalBuilder = builder
            .from(transferFromNode)
            .to(transferToNode)
            .currency(transfer.currency)
            .amount(transfer.amount)
            .address(transfer.address, transfer.ahAddress);
        } else if (transferFromNode) {
          // Parachain to relaychain
          finalBuilder = builder
            .from(transferFromNode)
            .amount(transfer.amount)
            .address(transfer.address);
        } else {
          // Relaychain to parachain
          finalBuilder = builder
            .to(transferToNode as TNodePolkadotKusama)
            .amount(transfer.amount)
            .address(transfer.address);
        }

        if (transfer.xcmVersion) {
          finalBuilder = finalBuilder.xcmVersion(transfer.xcmVersion);
        }

        builder = finalBuilder.addToBatch();
      }

      if (usePapi) {
        const tx = await builder.buildBatch(options ?? undefined);
        return (
          await (tx as SdkPapiType.TPapiTransaction).getEncodedData()
        ).asHex();
      }

      return await builder.buildBatch(options ?? undefined);
    } catch (e) {
      if (
        e instanceof InvalidCurrencyError ||
        e instanceof IncompatibleNodesError ||
        e instanceof BadRequestException
      ) {
        throw new BadRequestException(e.message);
      }

      throw new InternalServerErrorException((e as Error).message);
    } finally {
      if ('disconnect' in api) await api.disconnect();
      else api.destroy();
    }
  }
}
