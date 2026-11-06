import {
  InvalidAddressError,
  isChainEvm,
  MissingParameterError,
  ScenarioNotSupportedError,
  ValidationError,
} from '@paraspell/sdk-core';
import { ethers } from 'ethers-v6';

import type { TBuildTransactionsOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';

/**
 * Upper bound for the accepted slippage percentage. Values above this level are
 * almost certainly input mistakes (wrong units, exponent notation, etc.) and
 * would allow receiving zero assets back from a swap.
 */
const MAX_SLIPPAGE_PCT = 50;

export const validateSlippagePct = (slippagePct: string | undefined) => {
  if (slippagePct === undefined) return;

  const trimmed = slippagePct.trim();
  if (trimmed.length === 0 || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new ValidationError(
      `Slippage percentage "${slippagePct}" is not a valid decimal number`,
    );
  }

  const pct = Number(trimmed);
  if (pct <= 0 || pct > MAX_SLIPPAGE_PCT) {
    throw new ValidationError(
      `Slippage percentage must be greater than 0 and at most ${MAX_SLIPPAGE_PCT}, received: ${slippagePct}`,
    );
  }
};

export const validateTransferOptions = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
) => {
  const { from, exchange, evmSenderAddress, sender, recipient, to, slippagePct } = options;

  if (exchange === undefined && from === undefined) {
    throw new MissingParameterError('from', 'Origin chain is required when exchange is auto');
  }

  if (to && !recipient) {
    throw new MissingParameterError('recipient', 'Recipient address is required');
  }

  if (to && recipient) validateDestinationAddress(recipient, to);

  if (evmSenderAddress !== undefined && !ethers.isAddress(evmSenderAddress)) {
    throw new InvalidAddressError('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(sender)) {
    throw new InvalidAddressError(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }

  if (from && isChainEvm(from) && !evmSenderAddress) {
    throw new MissingParameterError('evmSenderAddress', 'EVM sender address is required');
  }

  validateSlippagePct(slippagePct);
};

export const validateRoutedFeeAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>({
  feeAsset,
}: Pick<TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>, 'feeAsset'>) => {
  if (feeAsset) {
    throw new ScenarioNotSupportedError(
      'Fee asset is only supported for swaps that use the execute transfer',
    );
  }
};
