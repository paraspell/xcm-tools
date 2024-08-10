import { useForm } from "@mantine/form";
import { FC } from "react";
import { Button, Checkbox, Select, Stack, TextInput } from "@mantine/core";
import {
  NODES_WITH_RELAY_CHAINS,
  TAsset,
  TNodePolkadotKusama,
} from "@paraspell/sdk";
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

  const { currencyOptions, currencyMap } = useCurrencyOptions(
    "Ethereum",
    form.values.to
  );

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

        <Select
          label="Currency"
          placeholder="Pick value"
          data={currencyOptions}
          allowDeselect={false}
          searchable
          required
          {...form.getInputProps("currencyOptionId")}
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
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default EthBridgeTransferForm;
