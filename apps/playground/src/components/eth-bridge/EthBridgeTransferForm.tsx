import { useForm } from "@mantine/form";
import type { FC } from "react";
import { Button, Checkbox, Select, Stack, TextInput } from "@mantine/core";
import type { TAsset, TNodePolkadotKusama } from "@paraspell/sdk";
import { NODES_WITH_RELAY_CHAINS_DOT_KSM } from "@paraspell/sdk";
import { isValidPolkadotAddress } from "../../utils";
import useCurrencyOptions from "../../hooks/useCurrencyOptions";

export type FormValues = {
  to: TNodePolkadotKusama;
  currencyOptionId: string;
  address: string;
  amount: string;
  useApi: boolean;
};

export type FormValuesTransformed = FormValues & {
  currency?: TAsset;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const EthBridgeTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      to: "AssetHubPolkadot",
      currencyOptionId: "",
      amount: "1000000000",
      address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidPolkadotAddress(value) ? null : "Invalid address",
    },
  });

  const { to } = form.getValues();

  const { currencyOptions, currencyMap } = useCurrencyOptions("Ethereum", to);

  const onSubmitInternal = (values: FormValues) => {
    const currency = currencyMap[values.currencyOptionId];

    if (!currency) {
      return;
    }

    const transformedValues = { ...values, currency: currency };

    onSubmit(transformedValues);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmitInternal)}>
      <Stack>
        <Select
          label="From"
          placeholder="Pick value"
          data={["Ethereum"]}
          allowDeselect={false}
          searchable
          disabled
          value="Ethereum"
        />

        <Select
          label="To"
          placeholder="Pick value"
          data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
          allowDeselect={false}
          searchable
          required
          data-testid="select-destination"
          {...form.getInputProps("to")}
        />

        <Select
          label="Currency"
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          searchable
          required
          data-testid="select-currency"
          {...form.getInputProps("currencyOptionId")}
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
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default EthBridgeTransferForm;
