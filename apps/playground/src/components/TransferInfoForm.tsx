import { useForm } from "@mantine/form";
import { isValidWalletAddress } from "../utils";
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
import {
  NODES_WITH_RELAY_CHAINS,
  TNodeDotKsmWithRelayChains,
} from "@paraspell/sdk";

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
          {...form.getInputProps("from")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
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
          {...form.getInputProps("address")}
        />

        <TextInput
          label="Destination Address"
          placeholder="0x0000000"
          required
          {...form.getInputProps("destinationAddress")}
        />

        <TextInput
          label="Amount"
          placeholder="0"
          required
          {...form.getInputProps("amount")}
        />

        <Checkbox label="Use XCM API" {...form.getInputProps("useApi")} />

        <Button type="submit" loading={loading}>
          Show Transfer Info
        </Button>
      </Stack>
    </form>
  );
};

export default TransferInfoForm;
