import type { ComboboxItem } from '@mantine/core';
import {
  Checkbox,
  Group,
  JsonInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { isRelayChain } from '@paraspell/sdk';
import type { FC } from 'react';
import { useEffect } from 'react';

type Props = {
  form: UseFormReturnType<any>;
  currencyOptions: ComboboxItem[];
  index: number;
  isAutoExchange?: boolean;
};

export const CurrencySelection: FC<Props> = ({
  form,
  currencyOptions,
  index,
  isAutoExchange = false,
}) => {
  const { from, to, currencies } = form.getValues();

  const isCustomCurrency = currencies[index].isCustomCurrency;
  const customCurrencyType = currencies[index].customCurrencyType;

  useEffect(() => {
    if (!customCurrencyType) return;
    form.setFieldValue(`currencies.${index}.customCurrency`, '');
  }, [customCurrencyType]);

  const isRelayToPara = isRelayChain(from);
  const isParaToRelay = isRelayChain(to);

  const isNotParaToPara = isRelayToPara || isParaToRelay;

  // If it's not para-to-para, we do not allow custom currencies
  useEffect(() => {
    if (isNotParaToPara) {
      form.setFieldValue(`currencies.${index}.isCustomCurrency`, false);
    }
  }, [isNotParaToPara]);

  // If auto exchange is used and user had selected Asset ID, reset to Symbol
  useEffect(() => {
    if (isAutoExchange && customCurrencyType === 'id') {
      form.setFieldValue(`currencies.${index}.customCurrencyType`, 'symbol');
    }
  }, [isAutoExchange, customCurrencyType, form, index]);

  const options = [
    { 
      label: 'Asset ID', 
      value: 'id',
      disabled: isAutoExchange // Gray out and disable when auto exchange is used
    },
    { label: 'Symbol', value: 'symbol' },
    { label: 'Location', value: 'location' },
    ...(currencies.length === 1
      ? [{ label: 'Override location', value: 'overridenLocation' }]
      : []),
  ];

  const symbolSpecifierOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Native', value: 'native' },
    { label: 'Foreign', value: 'foreign' },
    { label: 'Foreign abstract', value: 'foreignAbstract' },
  ];

  const size = currencies.length > 1 ? 'xs' : 'sm';

  return (
    <Stack gap="xs">
      {isCustomCurrency &&
        (customCurrencyType === 'id' || customCurrencyType === 'symbol') && (
          <TextInput
            size={size}
            label="Custom currency"
            placeholder={customCurrencyType === 'id' ? 'Asset ID' : 'Symbol'}
            required
            {...form.getInputProps(`currencies.${index}.customCurrency`)}
          />
        )}

      {isCustomCurrency && customCurrencyType === 'location' && (
        <JsonInput
          size={size}
          placeholder="Input JSON location or interior junctions"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`currencies.${index}.customCurrency`)}
        />
      )}

      {isCustomCurrency && customCurrencyType === 'overridenLocation' && (
        <JsonInput
          size={size}
          placeholder="Provide the JSON location to override the default configuration"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`currencies.${index}.customCurrency`)}
        />
      )}

      {!isCustomCurrency && (
        <Select
          key={from + to}
          size={size}
          label="Currency"
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          disabled={isRelayToPara}
          searchable
          required
          data-testid="select-currency"
          {...form.getInputProps(`currencies.${index}.currencyOptionId`)}
        />
      )}

      {!isNotParaToPara && (
        <Group>
          <Group>
            <Checkbox
              size="xs"
              label="Select custom asset"
              {...form.getInputProps(`currencies.${index}.isCustomCurrency`, {
                type: 'checkbox',
              })}
            />
          </Group>
          <Stack gap={8}>
            {isCustomCurrency && (
              <SegmentedControl
                size="xs"
                data={options}
                {...form.getInputProps(
                  `currencies.${index}.customCurrencyType`,
                )}
              />
            )}
            {isCustomCurrency && customCurrencyType === 'symbol' && (
              <SegmentedControl
                size="xs"
                w="100%"
                data={symbolSpecifierOptions}
                {...form.getInputProps(
                  `currencies.${index}.customCurrencySymbolSpecifier`,
                )}
              />
            )}
          </Stack>
        </Group>
      )}
    </Stack>
  );
};
