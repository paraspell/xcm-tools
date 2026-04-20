import type { UseFormReturnType } from '@mantine/form';
import type { TChain, TExchangeChain } from '@paraspell/sdk';
import { useEffect, useMemo } from 'react';

import type { TFormValues } from '../types';
import { isSwapActive } from '../utils';
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

  const swapActive = isSwapActive(form.values.swapOptions);

  const activeCurrencyOptions = swapActive
    ? swapCurrencyFromOptions
    : currencyOptions;

  const activeCurrencyMap = swapActive ? swapCurrencyFromMap : currencyMap;

  const currencyKey = useMemo(
    () => `${from}${to}${swapActive ? exchange.join() : ''}`,
    [from, to, swapActive, exchange],
  );

  // Invalidate currency selections when swap exchange changes
  useEffect(() => {
    if (!swapActive) return;
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
