import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Builder,
  GeneralBuilder,
  getBridgeStatus,
  getChainProviders,
  getParaEthTransferFees,
  TPapiApi,
  TPapiSigner,
  TPapiTransaction,
  TTransferBaseOptionsWithSender,
  TTransferBaseOptionsWithSwap,
} from '@paraspell/sdk';
import { getExchangePairs } from '@paraspell/swap';
import { toHex } from 'polkadot-api/utils';

import { handleXcmApiError } from '../utils/error-handler.js';
import { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import {
  DryRunPreviewDto,
  ExchangePairsDto,
  GetXcmFeeDto,
  SignAndSubmitDto,
  XTransferDto,
  XTransferDtoWSender,
} from './dto/XTransferDto.js';

@Injectable()
export class XTransferService {
  private async executeWithSwapBuilder<T>(
    transfer: XTransferDtoWSender,
    executor: (
      finalBuilder: GeneralBuilder<
        TTransferBaseOptionsWithSwap<TPapiApi, TPapiTransaction, TPapiSigner>
      >,
    ) => Promise<T>,
  ): Promise<T> {
    const { swapOptions } = transfer;
    return this.executeWithBuilderOptionalSender(transfer, (finalBuilder) => {
      if (!swapOptions) {
        throw new BadRequestException(
          'SwapOptions are required for this operation.',
        );
      }
      return executor(
        finalBuilder.swap({
          ...swapOptions,
          slippage:
            swapOptions.slippage !== undefined
              ? Number(swapOptions.slippage)
              : undefined,
          exchange: swapOptions.exchange,
        }),
      );
    });
  }

  private async executeWithBuilder<T>(
    transfer: XTransferDtoWSender,
    executor: (
      finalBuilder: GeneralBuilder<
        TTransferBaseOptionsWithSender<TPapiApi, TPapiTransaction, TPapiSigner>
      >,
    ) => Promise<T>,
  ): Promise<T> {
    const { sender } = transfer;
    return this.executeWithBuilderOptionalSender(transfer, (finalBuilder) =>
      executor(finalBuilder.sender(sender)),
    );
  }

  private async executeWithBuilderOptionalSender<T>(
    transfer: XTransferDto,
    executor: (
      finalBuilder: ReturnType<typeof this.buildXTransfer>,
    ) => Promise<T>,
  ): Promise<T> {
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

  private buildXTransfer(
    builder: ReturnType<typeof Builder>,
    transfer: XTransferDto,
  ) {
    const {
      from,
      to,
      currency,
      feeAsset,
      sender,
      recipient,
      xcmVersion,
      keepAlive,
      pallet,
      method,
      ahAddress,
      transactOptions,
      swapOptions,
    } = transfer;

    let finalBuilder = builder
      .from(from)
      .to(to)
      .currency(currency)
      .feeAsset(feeAsset)
      .recipient(recipient)
      .ahAddress(ahAddress);

    if (sender) {
      finalBuilder = finalBuilder.sender(sender);
    }

    if (xcmVersion) {
      finalBuilder = finalBuilder.xcmVersion(xcmVersion);
    }

    if (keepAlive) {
      finalBuilder = finalBuilder.keepAlive(keepAlive);
    }

    if (pallet || method) {
      finalBuilder = finalBuilder.customPallet(pallet, method);
    }

    if (transactOptions) {
      const { call, originKind, maxWeight } = transactOptions;
      finalBuilder = finalBuilder.transact(call, originKind, maxWeight);
    }

    if (swapOptions) {
      const { exchange, ...rest } = swapOptions;
      finalBuilder = finalBuilder.swap({
        ...rest,
        slippage:
          rest.slippage !== undefined ? Number(rest.slippage) : undefined,
        exchange,
      });
    }

    return finalBuilder;
  }

  dryRun(transfer: XTransferDtoWSender) {
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
    return this.executeWithBuilder(transfer, (builder) => builder.getXcmFee());
  }

  getOriginXcmFee(transfer: GetXcmFeeDto) {
    return this.executeWithBuilder(transfer, (builder) =>
      builder.getOriginXcmFee(),
    );
  }

  generateXcmCall(transfer: XTransferDto) {
    return this.executeWithBuilderOptionalSender(
      transfer,
      async (finalBuilder) => {
        const tx = await finalBuilder.build();
        const encoded = await tx.getEncodedData();
        return toHex(encoded);
      },
    );
  }

  generateXcmCalls(transfer: XTransferDto) {
    return this.executeWithBuilderOptionalSender(
      transfer,
      async (finalBuilder) => {
        const txContexts = await finalBuilder.buildAll();

        const response = await Promise.all(
          txContexts.map(async (txContext) => {
            const txData = await txContext.tx.getEncodedData();
            const txHash = toHex(txData);

            return {
              type: txContext.type,
              chain: txContext.chain,
              tx: txHash,
              wsProviders: getChainProviders(txContext.chain),
            };
          }),
        );

        return response;
      },
    );
  }

  signAndSubmit(transfer: SignAndSubmitDto) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.signAndSubmit(),
    );
  }

  getTransferableAmount(transfer: XTransferDtoWSender) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getTransferableAmount(),
    );
  }

  getMinTransferableAmount(transfer: XTransferDtoWSender) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getMinTransferableAmount(),
    );
  }

  verifyEdOnDestination(transfer: XTransferDtoWSender) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.verifyEdOnDestination(),
    );
  }

  getTransferInfo(transfer: XTransferDtoWSender) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getTransferInfo(),
    );
  }

  getReceivableAmount(transfer: XTransferDtoWSender) {
    return this.executeWithBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getReceivableAmount(),
    );
  }

  getBestAmountOut(transfer: XTransferDtoWSender) {
    return this.executeWithSwapBuilder(transfer, async (finalBuilder) =>
      finalBuilder.getBestAmountOut(),
    );
  }

  async generateBatchXcmCall(batchDto: BatchXTransferDto) {
    const { transfers, options } = batchDto;

    if (!transfers || transfers.length === 0) {
      throw new BadRequestException('Transfers array cannot be empty.');
    }

    const fromChain = transfers[0].from;

    const sameFrom = transfers.every((transfer) => transfer.from === fromChain);
    if (!sameFrom) {
      throw new BadRequestException(
        'All transactions in the batch must have the same origin.',
      );
    }

    const { mode, ...optionsWithoutMode } = options ?? {};
    const hasOptions = options && Object.keys(optionsWithoutMode).length > 0;

    let builder = Builder(
      hasOptions ? optionsWithoutMode : undefined,
    ) as ReturnType<typeof this.buildXTransfer>;

    try {
      for (const transfer of transfers) {
        const finalBuilder = this.buildXTransfer(builder, transfer);
        builder = finalBuilder.addToBatch();
      }

      const batchOptions = options?.mode ? { mode: options.mode } : undefined;
      const tx = await builder.buildBatch(batchOptions);

      const encoded = await tx.getEncodedData();
      return toHex(encoded);
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

  getExchangePairs(exchange: ExchangePairsDto['exchange']) {
    return getExchangePairs(exchange);
  }
}
