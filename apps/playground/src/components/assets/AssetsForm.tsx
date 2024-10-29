import { useForm } from "@mantine/form";
import type { FC } from "react";
import {
  Button,
  Checkbox,
  Group,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import type { TNodePolkadotKusama } from "@paraspell/sdk";
import { NODE_NAMES } from "@paraspell/sdk";
import type { TAssetsQuery } from "../../types";
import { ASSET_QUERIES } from "../../consts";

export type FormValues = {
  func: TAssetsQuery;
  node: TNodePolkadotKusama;
  currency: string;
  address: string;
  useApi: boolean;
  currencyType?: "id" | "symbol";
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AssetsForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      func: "ASSETS_OBJECT",
      node: "Acala",
      currency: "GLMR",
      address: "",
      useApi: false,
      currencyType: "symbol",
    },
  });

  const funcVal = form.values.func;

  const showSymbolInput =
    funcVal === "ASSET_ID" ||
    funcVal === "DECIMALS" ||
    funcVal == "HAS_SUPPORT" ||
    funcVal === "BALANCE_FOREIGN" ||
    funcVal === "ASSET_BALANCE";

  const supportsCurrencyType =
    funcVal === "BALANCE_FOREIGN" || funcVal === "ASSET_BALANCE";

  const showAddressInput =
    funcVal === "BALANCE_FOREIGN" ||
    funcVal === "BALANCE_NATIVE" ||
    funcVal === "ASSET_BALANCE";

  const onSubmitInternal = (formValues: FormValues) => {
    const { func } = formValues;
    const usesSymbol =
      func === "ASSET_ID" || func === "DECIMALS" || func === "HAS_SUPPORT";
    return onSubmit({
      ...formValues,
      ...(usesSymbol && { symbol: formValues.currency }),
    });
  };

  return (
    <form onSubmit={form.onSubmit(onSubmitInternal)}>
      <Stack>
        <Select
          label="Function"
          placeholder="Pick value"
          data={[...ASSET_QUERIES]}
          searchable
          required
          allowDeselect={false}
          data-testid="select-func"
          {...form.getInputProps("func")}
        />

        <Select
          label="Node"
          placeholder="Pick value"
          data={[...NODE_NAMES]}
          searchable
          required
          allowDeselect={false}
          data-testid="select-node"
          {...form.getInputProps("node")}
        />

        {showSymbolInput && (
          <Group align="flex-end">
            <TextInput
              flex={1}
              label={supportsCurrencyType ? "Currency" : "Symbol"}
              placeholder={
                supportsCurrencyType
                  ? "GLMR"
                  : form.values.currencyType === "id"
                    ? "Asset ID"
                    : "Symbol"
              }
              required
              data-testid="input-currency"
              {...form.getInputProps("currency")}
            />
            {supportsCurrencyType && (
              <SegmentedControl
                size="xs"
                pb={8}
                data={[
                  { label: "Asset ID", value: "id" },
                  { label: "Symbol", value: "symbol" },
                ]}
                data-testid="currency-type"
                {...form.getInputProps("currencyType")}
              />
            )}
          </Group>
        )}

        {showAddressInput && (
          <TextInput
            label="Address"
            placeholder="0x0000000"
            required
            data-testid="address-input"
            {...form.getInputProps("address")}
          />
        )}

        <Checkbox
          label="Use XCM API"
          {...form.getInputProps("useApi")}
          data-testid="checkbox-api"
        />

        <Button type="submit" loading={loading} data-testid="submit">
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default AssetsForm;
