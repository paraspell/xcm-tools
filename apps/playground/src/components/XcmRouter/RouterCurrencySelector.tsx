import type { ComboboxItem } from '@mantine/core';
import {
  Checkbox,
  JsonInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { isRelayChain, type TChain } from '@paraspell/sdk';
import type { FC } from 'react';
import { useEffect, useMemo } from 'react';

import type { CurrencyFieldMap } from '../../types';
import type { TRouterFormValues } from './XcmRouterForm';

type Props = {
  form: UseFormReturnType<TRouterFormValues>;
  side: 'from' | 'to';
  currencyOptions: ComboboxItem[];
};

const isRelayChainSafe = (chain?: unknown): boolean => {
  if (typeof chain !== 'string') return false;
  return isRelayChain(chain as TChain);
};

export const RouterCurrencyPicker: FC<Props> = ({
  form,
  side,
  currencyOptions,
}) => {
  const { from, to } = form.values;

  const fields: CurrencyFieldMap = useMemo(
    () =>
      side === 'from'
        ? {
            isCustom: 'currencyFrom.isCustom',
            type: 'currencyFrom.customType',
            value: 'currencyFrom.customValue',
            symbol: 'currencyFrom.customSymbolSpecifier',
            optionId: 'currencyFrom.optionId',
            label: 'From',
          }
        : {
            isCustom: 'currencyTo.isCustom',
            type: 'currencyTo.customType',
            value: 'currencyTo.customValue',
            symbol: 'currencyTo.customSymbolSpecifier',
            optionId: 'currencyTo.optionId',
            label: 'To',
          },
    [side],
  );

  const entry =
    side === 'from' ? form.values.currencyFrom : form.values.currencyTo;

  const isCustom = entry.isCustom;
  const customType = entry.customType;

  const isRelayToPara = isRelayChainSafe(from);
  const isParaToRelay = isRelayChainSafe(to);

  const isNotParaToPara = isRelayToPara || isParaToRelay;

  const selectDisabledByTopology =
    side === 'from' ? isRelayToPara : isParaToRelay;

  useEffect(() => {
    if (isCustom && !customType) {
      form.setFieldValue(fields.type, 'id');
    }
  }, [isCustom, customType]);

  useEffect(() => {
    if (customType) {
      form.setFieldValue(fields.value, '');
    }
  }, [customType]);

  // If it's not para-to-para, we do not allow custom currencies
  useEffect(() => {
    if (isNotParaToPara && isCustom) {
      form.setFieldValue(fields.isCustom, false);
    }
  }, [isNotParaToPara, isCustom]);

  const options = [
    { label: 'Asset ID', value: 'id' },
    { label: 'Symbol', value: 'symbol' },
    { label: 'Location', value: 'location' },
  ];

  const symbolSpecifierOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Native', value: 'native' },
    { label: 'Foreign', value: 'foreign' },
  ];

  return (
    <Stack gap="xs">
      {isCustom && (customType === 'id' || customType === 'symbol') && (
        <TextInput
          size="sm"
          label={`Custom Currency ${fields.label}`}
          placeholder={customType === 'id' ? 'Asset ID' : 'Symbol'}
          required
          {...form.getInputProps(fields.value)}
        />
      )}

      {isCustom && customType === 'location' && (
        <JsonInput
          size="sm"
          placeholder="Input JSON location or interior junctions"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(fields.value)}
        />
      )}

      {!isCustom && (
        <Select
          key={`${from ?? ''}-${to ?? ''}-${side}`}
          size="sm"
          label={`Currency ${fields.label}`}
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          disabled={selectDisabledByTopology}
          searchable
          required
          data-testid={`select-currency-${side}`}
          {...form.getInputProps(fields.optionId)}
        />
      )}

      {!isNotParaToPara && (
        <Stack gap="xs">
          <Checkbox
            size="xs"
            label="Select custom asset"
            {...form.getInputProps(fields.isCustom, {
              type: 'checkbox',
            })}
          />

          {isCustom && (
            <SegmentedControl
              size="xs"
              data={options}
              {...form.getInputProps(fields.type)}
            />
          )}

          {isCustom && customType === 'symbol' && (
            <SegmentedControl
              size="xs"
              w="100%"
              data={symbolSpecifierOptions}
              {...form.getInputProps(fields.symbol)}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
};
