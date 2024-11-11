import { Stack, Select, TextInput, Button, Checkbox } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { TNodeDotKsmWithRelayChains } from "@paraspell/sdk";
import type { FC } from "react";
import { isValidWalletAddress } from "../../utils";

const SUPPORTED_NODES: TNodeDotKsmWithRelayChains[] = [
  "Polkadot",
  "Kusama",
  "AssetHubPolkadot",
  "AssetHubKusama",
];

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
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
          allowDeselect={false}
          data-testid="select-origin"
          {...form.getInputProps("from")}
        />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          data-testid="input-address"
          {...form.getInputProps("address")}
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
          Claim asset
        </Button>
      </Stack>
    </form>
  );
};

export default AssetClaimForm;
