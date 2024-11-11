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
import type { FormValues } from "./TransferForm";
import { isRelayChain } from "@paraspell/sdk";

type Props = {
  form: UseFormReturnType<FormValues>;
  currencyOptions: ComboboxItem[];
};

const CurrencySelection: FC<Props> = ({ form, currencyOptions }) => {
  useEffect(() => {
    if (!form.values.customCurrencyType) return;
    form.setFieldValue("customCurrency", "");
  }, [form.values.customCurrencyType]);

  const isNotParaToPara =
    isRelayChain(form.values.from) || isRelayChain(form.values.to);

  return (
    <Stack gap="xs">
      {form.values.isCustomCurrency &&
        (form.values.customCurrencyType === "id" ||
          form.values.customCurrencyType === "symbol") && (
          <TextInput
            label="Custom currency"
            placeholder={
              form.values.customCurrencyType === "id" ? "Asset ID" : "Symbol"
            }
            required
            {...form.getInputProps("customCurrency")}
          />
        )}

      {form.values.isCustomCurrency &&
        form.values.customCurrencyType === "multilocation" && (
          <JsonInput
            placeholder="Input Multi-Location JSON or interior junctions JSON to search for and identify the asset"
            formatOnBlur
            autosize
            minRows={10}
            {...form.getInputProps("customCurrency")}
          />
        )}

      {form.values.isCustomCurrency &&
        form.values.customCurrencyType === "overridenMultilocation" && (
          <JsonInput
            placeholder="Provide the XCM Multi-Location JSON to override the default configuration"
            formatOnBlur
            autosize
            minRows={10}
            {...form.getInputProps("customCurrency")}
          />
        )}

      {!form.values.isCustomCurrency && (
        <Select
          key={form.values.from + form.values.to}
          label="Currency"
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          disabled={isNotParaToPara}
          searchable
          required
          data-testid="select-currency"
          {...form.getInputProps("currencyOptionId")}
        />
      )}
      {!isNotParaToPara && (
        <Group>
          <Checkbox
            size="xs"
            label="Select custom asset"
            {...form.getInputProps("isCustomCurrency", { type: "checkbox" })}
          />
          {form.values.isCustomCurrency && (
            <SegmentedControl
              size="xs"
              data={[
                { label: "Asset ID", value: "id" },
                { label: "Symbol", value: "symbol" },
                { label: "Multi-location", value: "multilocation" },
                {
                  label: "Override Multi-location",
                  value: "overridenMultilocation",
                },
              ]}
              {...form.getInputProps("customCurrencyType")}
            />
          )}
        </Group>
      )}
    </Stack>
  );
};

export default CurrencySelection;
