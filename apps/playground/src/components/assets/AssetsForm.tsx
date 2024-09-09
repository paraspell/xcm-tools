import { useForm } from "@mantine/form";
import { FC } from "react";
import {
  Button,
  Checkbox,
  Group,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { NODE_NAMES, TNodePolkadotKusama } from "@paraspell/sdk";
import { TAssetsQuery } from "../../types";
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
    funcVal === "BALANCE_FOREIGN";

  const supportsCurrencyType = funcVal === "BALANCE_FOREIGN";

  const showAddressInput =
    funcVal === "BALANCE_FOREIGN" || funcVal === "BALANCE_NATIVE";

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Function"
          placeholder="Pick value"
          data={[...ASSET_QUERIES]}
          searchable
          required
          {...form.getInputProps("func")}
        />

        <Select
          label="Node"
          placeholder="Pick value"
          data={[...NODE_NAMES]}
          searchable
          required
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
                {...form.getInputProps("customCurrencyType")}
              />
            )}
          </Group>
        )}

        {showAddressInput && (
          <TextInput
            label="Address"
            placeholder="0x0000000"
            required
            {...form.getInputProps("address")}
          />
        )}

        <Checkbox label="Use XCM API" {...form.getInputProps("useApi")} />

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default AssetsForm;
