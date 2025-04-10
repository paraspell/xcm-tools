import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Builder,
  GeneralBuilder,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
  TSendBaseOptions,
} from '@paraspell/sdk';

import { isValidWalletAddress } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import { XTransferDto } from './dto/XTransferDto.js';

@Injectable()
export class XTransferService {
  private validateTransfer(transfer: XTransferDto) {
    const { from, to, address, pallet, method, senderAddress } = transfer;

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

    if (fromNode === 'Hydration' && toNode === 'Ethereum' && !senderAddress) {
      throw new BadRequestException(
        'Sender address is required when transferring to Ethereum.',
      );
    }

    if ((pallet && !method) || (!pallet && method)) {
      throw new BadRequestException('Both pallet and method are required.');
    }
  }

  private buildXTransfer(
    builder: ReturnType<typeof Builder>,
    transfer: XTransferDto,
  ) {
    const {
      from,
      to,
      currency,
      feeAsset,
      address,
      xcmVersion,
      pallet,
      method,
      senderAddress,
    } = transfer;

    let finalBuilder = builder
      .from(from as TNodeDotKsmWithRelayChains)
      .to(to as TNodeWithRelayChains)
      .currency(currency)
      .feeAsset(feeAsset)
      .address(address, senderAddress);

    if (xcmVersion) {
      finalBuilder = finalBuilder.xcmVersion(xcmVersion);
    }

    if (pallet && method) {
      finalBuilder = finalBuilder.customPallet(pallet, method);
    }

    return finalBuilder;
  }

  async performDryRun(
    senderAddress: string | undefined,
    finalBuilder: ReturnType<typeof this.buildXTransfer>,
  ) {
    if (!senderAddress) {
      throw new BadRequestException('Sender address is required for dry run.');
    }

    try {
      return await finalBuilder.dryRun(senderAddress);
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await finalBuilder.disconnect();
    }
  }

  async generateXcmCall(transfer: XTransferDto, isDryRun = false) {
    this.validateTransfer(transfer);

    const { senderAddress } = transfer;

    const builder = Builder();

    const finalBuilder = this.buildXTransfer(builder, transfer);

    if (isDryRun) return this.performDryRun(senderAddress, finalBuilder);

    try {
      const tx = await finalBuilder.build();

      const encoded = await tx.getEncodedData();
      return encoded.asHex();
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await builder.disconnect();
    }
  }

  async generateBatchXcmCall(batchDto: BatchXTransferDto) {
    const { transfers, options } = batchDto;

    if (!transfers || transfers.length === 0) {
      throw new BadRequestException('Transfers array cannot be empty.');
    }

    const fromNode = transfers[0].from as TNodeDotKsmWithRelayChains;
    const toNode = transfers[0].to as TNodeDotKsmWithRelayChains;

    const sameFrom = transfers.every((transfer) => transfer.from === fromNode);
    if (!sameFrom) {
      throw new BadRequestException(
        'All transactions in the batch must have the same origin.',
      );
    }

    // Validate only the first fromNode because all transactions have the same origin
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

    let builder = Builder() as GeneralBuilder<TSendBaseOptions>;

    for (const transfer of transfers) {
      this.validateTransfer(transfer);
    }

    try {
      for (const transfer of transfers) {
        this.validateTransfer(transfer);
        const finalBuilder = this.buildXTransfer(builder, transfer);
        builder = finalBuilder.addToBatch();
      }

      const tx = await builder.buildBatch(options ?? undefined);

      const encoded = await tx.getEncodedData();
      return encoded.asHex();
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await builder.disconnect();
    }
  }
}
