import { useForm } from "@mantine/form";
import { isValidWalletAddress } from "../utils";
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
import type { TNodeDotKsmWithRelayChains } from "@paraspell/sdk";
import { NODES_WITH_RELAY_CHAINS } from "@paraspell/sdk";

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeDotKsmWithRelayChains;
  currency: string;
  address: string;
  destinationAddress: string;
  amount: string;
  useApi: boolean;
  customCurrencyType?: "id" | "symbol";
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const TransferInfoForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: "Acala",
      to: "Astar",
      currency: "",
      amount: "10000000000000000000",
      address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      destinationAddress: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      customCurrencyType: "symbol",
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : "Invalid address",
    },
  });

  const isNotParaToPara =
    form.values.from === "Polkadot" ||
    form.values.from === "Kusama" ||
    form.values.to === "Polkadot" ||
    form.values.to === "Kusama";

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          allowDeselect={false}
          data-testid="select-origin"
          {...form.getInputProps("from")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          allowDeselect={false}
          data-testid="select-destination"
          {...form.getInputProps("to")}
        />

        {!isNotParaToPara && (
          <Group align="flex-end">
            <TextInput
              flex={1}
              label="Currency"
              placeholder={
                form.values.customCurrencyType === "id" ? "Asset ID" : "Symbol"
              }
              required
              data-testid="input-currency"
              {...form.getInputProps("currency")}
            />
            <SegmentedControl
              size="xs"
              pb={8}
              data={[
                { label: "Asset ID", value: "id" },
                { label: "Symbol", value: "symbol" },
              ]}
              {...form.getInputProps("customCurrencyType")}
            />
          </Group>
        )}

        <TextInput
          label="Address"
          placeholder="0x0000000"
          required
          data-testid="input-address"
          {...form.getInputProps("address")}
        />

        <TextInput
          label="Destination Address"
          placeholder="0x0000000"
          required
          data-testid="input-destination-address"
          {...form.getInputProps("destinationAddress")}
        />

        <TextInput
          label="Amount"
          placeholder="0"
          required
          data-testid="input-amount"
          {...form.getInputProps("amount")}
        />

        <Checkbox
          label="Use XCM API"
          {...form.getInputProps("useApi")}
          data-testid="checkbox-api"
        />

        <Button type="submit" loading={loading} data-testid="submit">
          Show Transfer Info
        </Button>
      </Stack>
    </form>
  );
};

export default TransferInfoForm;
