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

import type { FormValues } from '../XcmTransfer/XcmTransferForm';

type Props = {
  form: UseFormReturnType<FormValues>;
  currencyOptions: ComboboxItem[];
  disabled?: boolean;
};

export const FeeAssetSelection: FC<Props> = ({
  form,
  currencyOptions,
  disabled = false,
}) => {
  const { from, to, feeAsset } = form.getValues();

  const isCustomCurrency = feeAsset.isCustomCurrency;
  const customCurrencyType = feeAsset.customCurrencyType;

  useEffect(() => {
    if (!customCurrencyType) return;
    form.setFieldValue(`feeAsset.customCurrency`, '');
  }, [customCurrencyType]);

  const isRelayToPara = isRelayChain(from);
  const isParaToRelay = isRelayChain(to);

  const isNotParaToPara = isRelayToPara || isParaToRelay;

  // If it's not para-to-para, we do not allow custom currencies
  useEffect(() => {
    if (isNotParaToPara) {
      form.setFieldValue(`feeAsset.isCustomCurrency`, false);
    }
  }, [isNotParaToPara]);

  const options = [
    { label: 'Asset ID', value: 'id' },
    { label: 'Symbol', value: 'symbol' },
    { label: 'Multi-location', value: 'multilocation' },
  ];

  const symbolSpecifierOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Native', value: 'native' },
    { label: 'Foreign', value: 'foreign' },
    { label: 'Foreign abstract', value: 'foreignAbstract' },
  ];

  const size = 'sm';

  return (
    <Stack gap="xs">
      {isCustomCurrency &&
        (customCurrencyType === 'id' || customCurrencyType === 'symbol') && (
          <TextInput
            size={size}
            label="Custom currency"
            placeholder={customCurrencyType === 'id' ? 'Asset ID' : 'Symbol'}
            required
            {...form.getInputProps(`feeAsset.customCurrency`)}
          />
        )}

      {isCustomCurrency && customCurrencyType === 'multilocation' && (
        <JsonInput
          size={size}
          placeholder="Input Multi-Location JSON or interior junctions JSON"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`feeAsset.customCurrency`)}
        />
      )}

      {isCustomCurrency && customCurrencyType === 'overridenMultilocation' && (
        <JsonInput
          size={size}
          placeholder="Provide the XCM Multi-Location JSON to override the default configuration"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`feeAsset.customCurrency`)}
        />
      )}

      {!isCustomCurrency && (
        <Select
          key={from + to}
          size={size}
          label="Fee asset"
          description="This asset will be used to pay fees"
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          disabled={isRelayToPara || disabled}
          searchable
          clearable
          data-testid="select-currency"
          {...form.getInputProps(`feeAsset.currencyOptionId`)}
        />
      )}

      {!isNotParaToPara && (
        <Group>
          <Group>
            <Checkbox
              size="xs"
              label="Select custom asset"
              disabled={isRelayToPara || disabled}
              {...form.getInputProps(`feeAsset.isCustomCurrency`, {
                type: 'checkbox',
              })}
            />
          </Group>
          <Stack gap={8}>
            {isCustomCurrency && (
              <SegmentedControl
                size="xs"
                data={options}
                {...form.getInputProps(`feeAsset.customCurrencyType`)}
              />
            )}
            {isCustomCurrency && customCurrencyType === 'symbol' && (
              <SegmentedControl
                size="xs"
                w="100%"
                data={symbolSpecifierOptions}
                {...form.getInputProps(
                  `feeAsset.customCurrencySymbolSpecifier`,
                )}
              />
            )}
          </Stack>
        </Group>
      )}
    </Stack>
  );
};
