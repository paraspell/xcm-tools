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
import { createFormActions, type UseFormReturnType } from '@mantine/form';
import { useEffect, useRef } from 'react';

import { MAIN_FORM_NAME } from '../../constants';
import type { TCurrencyEntryBase } from '../../types';
import { ComboboxSelect } from './ComboboxSelect';

const { setFieldValue } = createFormActions(MAIN_FORM_NAME);

type Props<T extends object> = {
  form: UseFormReturnType<T>;
  fieldPath: string;
  fieldValue: TCurrencyEntryBase;
  currencyOptions: ComboboxItem[];
  size?: MantineSize;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  onClear?: () => void;
  onAddCustom?: () => void;
  dataTestId?: string;
};

export const CurrencySelection = <T extends object>({
  form,
  fieldPath,
  fieldValue,
  currencyOptions,
  size = 'sm',
  required = false,
  disabled,
  label = 'Currency',
  description,
  onClear,
  onAddCustom,
  dataTestId,
}: Props<T>) => {
  const isCustomCurrency = fieldValue.isCustomCurrency;
  const customCurrencyType = fieldValue.customCurrencyType;

  const prevCustomCurrencyType = useRef(customCurrencyType);

  useEffect(() => {
    if (prevCustomCurrencyType.current === customCurrencyType) return;
    prevCustomCurrencyType.current = customCurrencyType;
    if (!customCurrencyType) return;
    setFieldValue(`${fieldPath}.customCurrency`, '');
  }, [customCurrencyType]);

  const options = [
    { label: 'Asset ID', value: 'id' },
    { label: 'Symbol', value: 'symbol' },
    { label: 'Location', value: 'location' },
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
            label={`${label} - Custom`}
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

      {!isCustomCurrency &&
        (onAddCustom ? (
          <ComboboxSelect
            size={size}
            label={label}
            description={description}
            required={required}
            disabled={disabled}
            data={currencyOptions}
            data-testid={dataTestId || 'select-currency'}
            onAddCustom={onAddCustom}
            addCustomLabel="Add custom asset"
            addCustomTestId="button-add-custom-asset"
            onClear={onClear}
            clearable={!!onClear}
            {...form.getInputProps(`${fieldPath}.currencyOptionId`)}
          />
        ) : (
          <Select
            size={size}
            label={label}
            description={description}
            placeholder="Pick value"
            data={currencyOptions}
            allowDeselect={false}
            searchable
            required={required}
            disabled={disabled}
            clearable={!!onClear}
            onClear={onClear}
            data-testid={dataTestId || 'select-currency'}
            {...form.getInputProps(`${fieldPath}.currencyOptionId`)}
          />
        ))}

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
