import { FC } from "react";
import {
  Select,
  Stack,
  TextInput,
  Checkbox,
  ComboboxItem,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { FormValues } from "./TransferForm";

type Props = {
  form: UseFormReturnType<FormValues>;
  currencyOptions: ComboboxItem[];
};

const CurrencySelection: FC<Props> = ({ form, currencyOptions }) => {
  return (
    <Stack gap="xs">
      {form.values.isCustomCurrency ? (
        <TextInput
          label="Custom currency"
          placeholder="Asset ID or symbol"
          required
          {...form.getInputProps("customCurrency")}
        />
      ) : (
        <Select
          key={form.values.from + form.values.to}
          label="Currency"
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("currencyOptionId")}
        />
      )}
      <Checkbox
        size="xs"
        label="Use Custom Currency"
        {...form.getInputProps("isCustomCurrency", { type: "checkbox" })}
      />
    </Stack>
  );
};

export default CurrencySelection;
