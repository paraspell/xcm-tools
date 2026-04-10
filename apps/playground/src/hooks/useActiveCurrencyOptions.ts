import type { UseFormReturnType } from '@mantine/form';
import type { TChain, TExchangeChain } from '@paraspell/sdk';
import { useEffect, useMemo } from 'react';

import type { TFormValues } from '../types';
import { useCurrencyOptions } from './useCurrencyOptions';
import { useSwapCurrencyOptions } from './useSwapCurrencyOptions';

export const useActiveCurrencyOptions = (
  form: UseFormReturnType<TFormValues>,
  from: TChain,
  to: TChain,
  exchange: TExchangeChain[],
) => {
  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    from,
    to,
  );

  const {
    currencyFromOptions: swapCurrencyFromOptions,
    currencyFromMap: swapCurrencyFromMap,
    currencyToMap: swapCurrencyToMap,
  } = useSwapCurrencyOptions(from, exchange, to);

  const isSwapActive =
    form.values.swapOptions.currencyTo.currencyOptionId !== '' ||
    form.values.swapOptions.currencyTo.isCustomCurrency ||
    exchange.length > 0;

  const activeCurrencyOptions = isSwapActive
    ? swapCurrencyFromOptions
    : currencyOptions;

  const activeCurrencyMap = isSwapActive ? swapCurrencyFromMap : currencyMap;

  const currencyKey = useMemo(
    () => `${from}${to}${isSwapActive ? exchange.join() : ''}`,
    [from, to, isSwapActive, exchange],
  );

  // Invalidate currency selections when swap exchange changes
  useEffect(() => {
    if (!isSwapActive) return;
    form.values.currencies.forEach((currency, index) => {
      if (!currency.isCustomCurrency && currency.currencyOptionId) {
        const isOptionStillValid = swapCurrencyFromOptions.some(
          (option) => option.value === currency.currencyOptionId,
        );
        if (!isOptionStillValid) {
          form.setFieldValue(`currencies.${index}.currencyOptionId`, '');
        }
      }
    });
  }, [isSwapActive, swapCurrencyFromOptions]);

  return {
    activeCurrencyOptions,
    activeCurrencyMap,
    currencyKey,
    isNotParaToPara,
    currencyMap,
    swapCurrencyToMap,
  };
};
