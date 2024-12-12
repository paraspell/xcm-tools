import type { FC } from "react";
import { useEffect } from "react";
import type { ComboboxItem } from "@mantine/core";
import {
  Select,
  Stack,
  TextInput,
  Checkbox,
  Group,
  SegmentedControl,
  JsonInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { FormValues } from "./transfer/XcmTransferForm";
import { isRelayChain } from "@paraspell/sdk";

type Props = {
  form: UseFormReturnType<FormValues>;
  currencyOptions: ComboboxItem[];
  index: number;
};

const CurrencySelection: FC<Props> = ({ form, currencyOptions, index }) => {
  const { from, to, currencies } = form.getValues();

  const isCustomCurrency = currencies[index].isCustomCurrency;
  const customCurrencyType = currencies[index].customCurrencyType;

  useEffect(() => {
    if (!customCurrencyType) return;
    form.setFieldValue(`currencies.${index}.customCurrency`, "");
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

  const options = [
    { label: "Asset ID", value: "id" },
    { label: "Symbol", value: "symbol" },
    { label: "Multi-location", value: "multilocation" },
    ...(currencies.length === 1
      ? [{ label: "Override Multi-location", value: "overridenMultilocation" }]
      : []),
  ];

  const size = currencies.length > 1 ? "xs" : "sm";

  return (
    <Stack gap="xs">
      {isCustomCurrency &&
        (customCurrencyType === "id" || customCurrencyType === "symbol") && (
          <TextInput
            size={size}
            label="Custom currency"
            placeholder={customCurrencyType === "id" ? "Asset ID" : "Symbol"}
            required
            {...form.getInputProps(`currencies.${index}.customCurrency`)}
          />
        )}

      {isCustomCurrency && customCurrencyType === "multilocation" && (
        <JsonInput
          size={size}
          placeholder="Input Multi-Location JSON or interior junctions JSON"
          formatOnBlur
          autosize
          minRows={10}
          {...form.getInputProps(`currencies.${index}.customCurrency`)}
        />
      )}

      {isCustomCurrency && customCurrencyType === "overridenMultilocation" && (
        <JsonInput
          size={size}
          placeholder="Provide the XCM Multi-Location JSON to override the default configuration"
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
                type: "checkbox",
              })}
            />
            {currencies.length > 1 && (
              <Checkbox
                size="xs"
                label="Is fee asset"
                {...form.getInputProps(`currencies.${index}.isFeeAsset`, {
                  type: "checkbox",
                })}
              />
            )}
          </Group>
          {isCustomCurrency && (
            <SegmentedControl
              size="xs"
              data={options}
              {...form.getInputProps(`currencies.${index}.customCurrencyType`)}
            />
          )}
        </Group>
      )}
    </Stack>
  );
};

export default CurrencySelection;
