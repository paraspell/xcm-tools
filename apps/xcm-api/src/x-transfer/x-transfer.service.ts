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
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
} from '@paraspell/sdk';
import type * as SdkType from '@paraspell/sdk-pjs';
import type * as SdkPapiType from '@paraspell/sdk';
import { ApiPromise } from '@polkadot/api';
import { PolkadotClient } from 'polkadot-api';
import { TPapiTransaction } from '@paraspell/sdk';
import { Extrinsic } from '@paraspell/sdk-pjs';

@Injectable()
export class XTransferService {
  async generateXcmCall(
    {
      from,
      to,
      address,
      ahAddress,
      currency,
      xcmVersion,
      pallet,
      method,
    }: XTransferDto,
    usePapi = false,
    isDryRun = false,
  ) {
    const fromNode = from as TNodeDotKsmWithRelayChains;
    const toNode = to as TNodeWithRelayChains;

    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${fromNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (
      typeof toNode === 'string' &&
      !NODES_WITH_RELAY_CHAINS.includes(toNode)
    ) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    if (fromNode === 'Hydration' && toNode === 'Ethereum' && !ahAddress) {
      throw new BadRequestException(
        'AssetHub address is required when transferring from Hydration to Ethereum.',
      );
    }

    if ((pallet && !method) || (!pallet && method)) {
      throw new BadRequestException('Both pallet and method are required.');
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    const api = await Sdk.createApiInstanceForNode(fromNode);

    const builder = Sdk.Builder(api as PolkadotClient & ApiPromise);

    let finalBuilder:
      | SdkPapiType.IFinalBuilderWithOptions
      | SdkType.IFinalBuilderWithOptions;

    finalBuilder = builder
      .from(fromNode)
      .to(toNode)
      .currency(currency)
      .address(address, ahAddress);

    if (xcmVersion) {
      finalBuilder = finalBuilder.xcmVersion(xcmVersion);
    }

    if (pallet && method) {
      finalBuilder = finalBuilder.customPallet(pallet, method);
    }

    try {
      const tx = await finalBuilder.build();

      if (isDryRun) {
        if (typeof address !== 'string') {
          throw new BadRequestException('Address is required for dry run.');
        }

        return await Sdk.getDryRun({
          api: api as ApiPromise & PolkadotClient,
          address,
          node: fromNode,
          tx: tx as Extrinsic & TPapiTransaction,
        });
      }

      if (usePapi) {
        return (await (tx as TPapiTransaction).getEncodedData()).asHex();
      }

      return tx;
    } catch (e) {
      if (
        e instanceof InvalidCurrencyError ||
        e instanceof IncompatibleNodesError ||
        e instanceof BadRequestException
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
    const fromNode = firstTransfer.from as TNodeDotKsmWithRelayChains;
    const toNode = firstTransfer.to as TNodeDotKsmWithRelayChains;

    const sameFrom = transfers.every((transfer) => transfer.from === fromNode);

    if (!sameFrom) {
      throw new BadRequestException(
        'All transactions must have the same origin.',
      );
    }

    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${fromNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (!NODES_WITH_RELAY_CHAINS.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    const api = await Sdk.createApiInstanceForNode(fromNode);
    let builder = Sdk.Builder(api as PolkadotClient & ApiPromise);

    try {
      for (const transfer of transfers) {
        const transferFromNode = transfer.from as TNodeDotKsmWithRelayChains;
        const transferToNode = transfer.to as TNodeWithRelayChains;

        if (
          typeof transferToNode === 'string' &&
          !NODES_WITH_RELAY_CHAINS.includes(transferToNode)
        ) {
          throw new BadRequestException(
            `Node ${transferToNode} is not valid. Check docs for valid nodes.`,
          );
        }

        if (
          typeof transfer.address === 'string' &&
          !isValidWalletAddress(transfer.address)
        ) {
          throw new BadRequestException('Invalid wallet address.');
        }

        if (
          (transfer.pallet && !transfer.method) ||
          (!transfer.pallet && transfer.method)
        ) {
          throw new BadRequestException('Both pallet and method are required.');
        }

        let finalBuilder:
          | SdkPapiType.IFinalBuilderWithOptions
          | SdkType.IFinalBuilderWithOptions;

        finalBuilder = builder
          .from(transferFromNode)
          .to(transferToNode)
          .currency(transfer.currency)
          .address(transfer.address, transfer.ahAddress);

        if (transfer.xcmVersion) {
          finalBuilder = finalBuilder.xcmVersion(transfer.xcmVersion);
        }

        if (transfer.pallet && transfer.method) {
          finalBuilder = finalBuilder.customPallet(
            transfer.pallet,
            transfer.method,
          );
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
