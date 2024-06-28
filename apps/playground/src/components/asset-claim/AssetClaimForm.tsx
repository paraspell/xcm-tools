import { Stack, Select, TextInput, Button, Checkbox } from "@mantine/core";
import { useForm } from "@mantine/form";
import { TNodeWithRelayChains } from "@paraspell/sdk";
import { FC } from "react";
import { isValidWalletAddress } from "../../utils";

const SUPPORTED_NODES: TNodeWithRelayChains[] = [
  "Polkadot",
  "Kusama",
  "AssetHubPolkadot",
  "AssetHubKusama",
];

export type FormValues = {
  from: TNodeWithRelayChains;
  address: string;
  amount: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AssetClaimForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: "Polkadot",
      amount: "10000000000000000000",
      address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : "Invalid address",
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Node"
          placeholder="Pick value"
          data={[...SUPPORTED_NODES]}
          searchable
          required
          {...form.getInputProps("from")}
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

        <Checkbox label="Use XCM API" {...form.getInputProps("useApi")} />

        <Button type="submit" loading={loading}>
          Claim asset
        </Button>
      </Stack>
    </form>
  );
};

export default AssetClaimForm;
