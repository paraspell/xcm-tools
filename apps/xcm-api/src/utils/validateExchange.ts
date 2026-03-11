import { BadRequestException } from '@nestjs/common';
import {
  EXCHANGE_CHAINS,
  type TExchangeChain,
  type TExchangeInput,
} from '@paraspell/swap';

export const validateExchange = (
  exchange?: string | string[],
): TExchangeInput => {
  const exchangeChain = exchange as TExchangeInput;

  const exchanges = exchangeChain
    ? ([] as TExchangeChain[]).concat(exchangeChain)
    : undefined;

  if (exchanges?.some((x) => !EXCHANGE_CHAINS.includes(x))) {
    throw new BadRequestException(
      `Exchange ${exchanges.toString()} is not valid. Check docs for valid exchanges.`,
    );
  }

  return exchangeChain;
};
