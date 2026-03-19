import { isChainEvm, MissingParameterError } from '@paraspell/sdk';

import type { TRouterBuilderOptions } from '../types';
import { type TTransferOptions } from '../types';
import { buildTransactions } from './buildTransactions';
import { executeRouterPlan } from './executeRouterPlan';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

export const transfer = async (
  initialOptions: TTransferOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<void> => {
  const {
    from,
    exchange: exchangeChain,
    signer,
    evmSigner,
    sender,
    evmSenderAddress,
    onStatusChange,
  } = initialOptions;

  validateTransferOptions(initialOptions);

  if (evmSigner !== undefined && evmSenderAddress === undefined) {
    throw new MissingParameterError('evmSenderAddress', 'evmSenderAddress is required');
  }

  if (evmSenderAddress !== undefined && evmSigner === undefined) {
    throw new MissingParameterError('evmSigner', 'evmSigner is required');
  }

  if (from && isChainEvm(from) && !evmSigner) {
    throw new MissingParameterError(
      'evmSigner',
      'EVM signer must be provided for EVM origin chains.',
    );
  }

  if (exchangeChain === undefined) {
    onStatusChange?.({
      type: 'SELECTING_EXCHANGE',
    });
  }

  const { dex, options } = await prepareTransformedOptions(initialOptions, builderOptions);

  const routerPlan = await buildTransactions(dex, options);

  await executeRouterPlan(routerPlan, {
    signer,
    sender,
    destination: options.destination?.chain,
    evmSigner,
    evmSenderAddress,
    onStatusChange,
  });
};
