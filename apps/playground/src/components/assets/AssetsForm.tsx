import { useForm } from "@mantine/form";
import { FC } from "react";
import { Button, Checkbox, Select, Stack, TextInput } from "@mantine/core";
import { NODE_NAMES, TNodePolkadotKusama } from "@paraspell/sdk";
import { TAssetsQuery } from "../../types";
import { ASSET_QUERIES } from "../../consts";

export type FormValues = {
  func: TAssetsQuery;
  node: TNodePolkadotKusama;
  symbol: string;
  address: string;
  useApi: boolean;
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
      symbol: "GLMR",
      address: "",
      useApi: false,
    },
  });

  const funcVal = form.values.func;

  const showSymbolInput =
    funcVal === "ASSET_ID" ||
    funcVal === "DECIMALS" ||
    funcVal == "HAS_SUPPORT" ||
    funcVal === "BALANCE_FOREIGN";

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
          <TextInput
            label="Symbol"
            placeholder="GLMR"
            required
            {...form.getInputProps("symbol")}
          />
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
