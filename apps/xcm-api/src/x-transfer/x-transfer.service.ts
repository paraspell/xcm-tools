import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Builder,
  CHAINS,
  GeneralBuilder,
  getBridgeStatus,
  getParaEthTransferFees,
  SUBSTRATE_CHAINS,
  TChain,
  TSendBaseOptions,
  TSubstrateChain,
} from '@paraspell/sdk';

import { isValidWalletAddress } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import {
  DryRunPreviewDto,
  GetXcmFeeDto,
  XTransferDto,
  XTransferDtoWSenderAddress,
} from './dto/XTransferDto.js';

@Injectable()
export class XTransferService {
  private async executeWithBuilder<T>(
    transfer: XTransferDto,
    executor: (
      finalBuilder: ReturnType<typeof this.buildXTransfer>,
    ) => Promise<T>,
  ): Promise<T> {
    this.validateTransfer(transfer);

    const { options } = transfer;

    const hasOptions = options && Object.keys(options).length > 0;

    const sdkBuilder = Builder(hasOptions ? options : undefined);
    const finalBuilder = this.buildXTransfer(sdkBuilder, transfer);

    try {
      return await executor(finalBuilder);
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await sdkBuilder.disconnect();
    }
  }

  private validateTransfer(transfer: XTransferDto) {
    const { from, to, address, pallet, method, senderAddress } = transfer;

    const fromChain = from as TSubstrateChain;
    const toChain = to as TChain;

    if (!SUBSTRATE_CHAINS.includes(fromChain)) {
      throw new BadRequestException(
        `Chain ${fromChain} is not valid. Check docs for valid chains.`,
      );
    }

    if (typeof toChain === 'string' && !CHAINS.includes(toChain)) {
      throw new BadRequestException(
        `Chain ${toChain} is not valid. Check docs for valid chains.`,
      );
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    if (fromChain === 'Hydration' && toChain === 'Ethereum' && !senderAddress) {
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
      ahAddress,
    } = transfer;

    let finalBuilder = builder
      .from(from as TSubstrateChain)
      .to(to as TChain)
      .currency(currency)
      .feeAsset(feeAsset)
      .address(address)
      .ahAddress(ahAddress)
      .senderAddress(senderAddress as string);

    if (xcmVersion) {
      finalBuilder = finalBuilder.xcmVersion(xcmVersion);
    }

    if (pallet && method) {
      finalBuilder = finalBuilder.customPallet(pallet, method);
    }

    return finalBuilder;
  }

  dryRun(transfer: XTransferDto) {
    return this.executeWithBuilder(transfer, (builder) => builder.dryRun());
  }

  dryRunPreview(transfer: DryRunPreviewDto) {
    return this.executeWithBuilder(transfer, (builder) =>
      builder.dryRunPreview({
        mintFeeAssets: transfer.options?.mintFeeAssets,
      }),
    );
  }

  getXcmFee(transfer: GetXcmFeeDto) {
    return this.executeWithBuilder(transfer as XTransferDto, (builder) =>
      builder.getXcmFee(),
    );
  }

  getOriginXcmFee(transfer: GetXcmFeeDto) {
    return this.executeWithBuilder(transfer as XTransferDto, (builder) =>
      builder.getOriginXcmFee(),
    );
  }

  getXcmFeeEstimate(transfer: XTransferDtoWSenderAddress) {
    return this.executeWithBuilder(transfer, (builder) =>
      builder.getXcmFeeEstimate(),
    );
  }

  getOriginXcmFeeEstimate(transfer: XTransferDtoWSenderAddress) {
    return this.executeWithBuilder(transfer, (builder) =>
      builder.getOriginXcmFeeEstimate(),
    );
  }

  generateXcmCall(transfer: XTransferDto) {
    return this.executeWithBuilder(transfer, async (finalBuilder) => {
      const tx = await finalBuilder.build();
      const encoded = await tx.getEncodedData();
      return encoded.asHex();
    });
  }

  getTransferableAmount(transfer: XTransferDtoWSenderAddress) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getTransferableAmount(),
    );
  }

  getMinTransferableAmount(transfer: XTransferDtoWSenderAddress) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getMinTransferableAmount(),
    );
  }

  verifyEdOnDestination(transfer: XTransferDtoWSenderAddress) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.verifyEdOnDestination(),
    );
  }

  getTransferInfo(transfer: XTransferDtoWSenderAddress) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getTransferInfo(),
    );
  }

  async generateBatchXcmCall(batchDto: BatchXTransferDto) {
    const { transfers, options } = batchDto;

    if (!transfers || transfers.length === 0) {
      throw new BadRequestException('Transfers array cannot be empty.');
    }

    const fromChain = transfers[0].from as TSubstrateChain;
    const toChain = transfers[0].to as TChain;

    const sameFrom = transfers.every((transfer) => transfer.from === fromChain);
    if (!sameFrom) {
      throw new BadRequestException(
        'All transactions in the batch must have the same origin.',
      );
    }

    // Validate only the first fromChain because all transactions have the same origin
    if (!SUBSTRATE_CHAINS.includes(fromChain)) {
      throw new BadRequestException(
        `Chain ${fromChain} is not valid. Check docs for valid chains.`,
      );
    }
    if (!CHAINS.includes(toChain)) {
      throw new BadRequestException(
        `Chain ${toChain} is not valid. Check docs for valid chains.`,
      );
    }

    const { mode, ...optionsWithoutMode } = options ?? {};
    const hasOptions = options && Object.keys(optionsWithoutMode).length > 0;

    let builder = Builder(
      hasOptions ? optionsWithoutMode : undefined,
    ) as GeneralBuilder<TSendBaseOptions>;

    for (const transfer of transfers) {
      this.validateTransfer(transfer);
    }

    try {
      for (const transfer of transfers) {
        this.validateTransfer(transfer);
        const finalBuilder = this.buildXTransfer(builder, transfer);
        builder = finalBuilder.addToBatch();
      }

      const batchOptions = options?.mode ? { mode: options.mode } : undefined;
      const tx = await builder.buildBatch(batchOptions);

      const encoded = await tx.getEncodedData();
      return encoded.asHex();
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await builder.disconnect();
    }
  }

  async getBridgeStatus() {
    return getBridgeStatus();
  }

  async getParaEthFees() {
    return getParaEthTransferFees();
  }
}
