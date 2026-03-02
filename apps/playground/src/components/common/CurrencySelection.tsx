import type { ComboboxItem, MantineSize } from '@mantine/core';
import {
  Checkbox,
  Group,
  JsonInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import type { LooseKeys, UseFormReturnType } from '@mantine/form';
import type { FC } from 'react';
import { useEffect } from 'react';

import type { TCurrencyEntryBase, TFormValues } from '../../types';

type Props = {
  form: UseFormReturnType<TFormValues>;
  fieldPath: LooseKeys<TFormValues>;
  fieldValue: TCurrencyEntryBase;
  currencyOptions: ComboboxItem[];
  showOverrideLocation?: boolean;
  size?: MantineSize;
  required?: boolean;
  disabled?: boolean;
};

export const CurrencySelection: FC<Props> = ({
  form,
  fieldPath,
  fieldValue,
  currencyOptions,
  showOverrideLocation = false,
  size = 'sm',
  required = false,
  disabled,
}) => {
  const { from, to } = form.getValues();

  const isCustomCurrency = fieldValue.isCustomCurrency;
  const customCurrencyType = fieldValue.customCurrencyType;

  useEffect(() => {
    if (!customCurrencyType) return;
    form.setFieldValue(`${fieldPath}.customCurrency`, '');
  }, [customCurrencyType]);

  const options = [
    { label: 'Asset ID', value: 'id' },
    { label: 'Symbol', value: 'symbol' },
    { label: 'Location', value: 'location' },
    ...(showOverrideLocation
      ? [{ label: 'Override location', value: 'overridenLocation' }]
      : []),
  ];

  const symbolSpecifierOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Native', value: 'native' },
    { label: 'Foreign', value: 'foreign' },
    { label: 'Foreign abstract', value: 'foreignAbstract' },
  ];

  return (
    <Stack gap="xs">
      {isCustomCurrency &&
        (customCurrencyType === 'id' || customCurrencyType === 'symbol') && (
          <TextInput
            size={size}
            label="Custom currency"
            placeholder={customCurrencyType === 'id' ? 'Asset ID' : 'Symbol'}
            required={required}
            {...form.getInputProps(`${fieldPath}.customCurrency`)}
          />
        )}

      {isCustomCurrency && customCurrencyType === 'location' && (
        <JsonInput
          size={size}
          placeholder="Input JSON location or interior junctions"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`${fieldPath}.customCurrency`)}
        />
      )}

      {isCustomCurrency && customCurrencyType === 'overridenLocation' && (
        <JsonInput
          size={size}
          placeholder="Provide the JSON location to override the default configuration"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`${fieldPath}.customCurrency`)}
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
          searchable
          required={required}
          disabled={disabled}
          data-testid="select-currency"
          {...form.getInputProps(`${fieldPath}.currencyOptionId`)}
        />
      )}

      <Group>
        <Group>
          <Checkbox
            size="xs"
            label="Select custom asset"
            disabled={disabled}
            {...form.getInputProps(`${fieldPath}.isCustomCurrency`, {
              type: 'checkbox',
            })}
          />
        </Group>
        <Stack gap={8}>
          {isCustomCurrency && (
            <SegmentedControl
              size="xs"
              data={options}
              {...form.getInputProps(`${fieldPath}.customCurrencyType`)}
            />
          )}
          {isCustomCurrency && customCurrencyType === 'symbol' && (
            <SegmentedControl
              size="xs"
              w="100%"
              data={symbolSpecifierOptions}
              {...form.getInputProps(
                `${fieldPath}.customCurrencySymbolSpecifier`,
              )}
            />
          )}
        </Stack>
      </Group>
    </Stack>
  );
};
