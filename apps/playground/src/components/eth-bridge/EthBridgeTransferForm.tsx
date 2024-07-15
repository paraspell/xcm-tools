import { useForm } from "@mantine/form";
import { FC } from "react";
import { Button, Select, Stack, TextInput } from "@mantine/core";
import { NODES_WITH_RELAY_CHAINS, TNodePolkadotKusama } from "@paraspell/sdk";
import { isValidPolkadotAddress } from "../../utils";

export type FormValues = {
  to: TNodePolkadotKusama;
  currency: string;
  address: string;
  amount: string;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const EthBridgeTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      to: "AssetHubPolkadot",
      currency: "WETH",
      amount: "1000000000",
      address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
    },

    validate: {
      address: (value) =>
        isValidPolkadotAddress(value) ? null : "Invalid address",
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="From"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          disabled
          value="Ethereum"
        />

        <Select
          label="To"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps("to")}
        />

        <TextInput
          label="Currency"
          placeholder="WETH"
          required
          {...form.getInputProps("currency")}
        />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          {...form.getInputProps("address")}
        />

        <TextInput
          label="Amount"
          placeholder="0"
          required
          {...form.getInputProps("amount")}
        />

        <Button type="submit" loading={loading}>
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default EthBridgeTransferForm;
