import { useForm } from "@mantine/form";
import { isValidWalletAddress } from "../utils";
import type { FC } from "react";
import { useEffect } from "react";
import { Button, Checkbox, Select, Stack, TextInput } from "@mantine/core";
import type {
  TAsset,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from "@paraspell/sdk";
import {
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from "@paraspell/sdk";
import useCurrencyOptions from "../hooks/useCurrencyOptions";
import CurrencySelection from "./CurrencySelection";

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeWithRelayChains;
  currencyOptionId: string;
  customCurrency: string;
  address: string;
  ahAddress: string;
  amount: string;
  useApi: boolean;
  isCustomCurrency: boolean;
  customCurrencyType?:
    | "id"
    | "symbol"
    | "multilocation"
    | "overridenMultilocation";
};

export type FormValuesTransformed = FormValues & {
  currency?: TAsset;
};

type Props = {
  onSubmit: (values: FormValuesTransformed) => void;
  loading: boolean;
};

const TransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: "Astar",
      to: "Moonbeam",
      currencyOptionId: "",
      customCurrency: "",
      amount: "10000000000000000000",
      address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      ahAddress: "",
      useApi: false,
      isCustomCurrency: false,
      customCurrencyType: "id",
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : "Invalid address",
      currencyOptionId: (value, values) => {
        if (values.isCustomCurrency) {
          return values.customCurrency ? null : "Custom currency is required";
        } else {
          return value ? null : "Currency selection is required";
        }
      },
      customCurrency: (value, values) => {
        if (values.isCustomCurrency) {
          return value ? null : "Custom currency is required";
        }
        return null;
      },
      ahAddress: (value, values) => {
        if (values.to === "Ethereum" && values.from === "Hydration") {
          return value
            ? null
            : "AssetHub address is required for transfers to Ethereum";
        }
        return null;
      },
    },
  });

  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    form.values.from,
    form.values.to,
  );

  const onSubmitInternal = (values: FormValues) => {
    if (values.isCustomCurrency) {
      onSubmit(values);
      return;
    }

    const currency = currencyMap[values.currencyOptionId];

    if (!currency) {
      return;
    }

    const transformedValues = { ...values, currency: currency };

    onSubmit(transformedValues);
  };

  useEffect(() => {
    if (isNotParaToPara && Object.keys(currencyMap).length === 1) {
      form.setFieldValue("currencyOptionId", Object.keys(currencyMap)[0]);
    }
  }, [isNotParaToPara, currencyMap]);

  return (
    <form onSubmit={form.onSubmit(onSubmitInternal)}>
      <Stack>
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
          allowDeselect={false}
          searchable
          required
          data-testid="select-origin"
          {...form.getInputProps("from")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={NODES_WITH_RELAY_CHAINS}
          allowDeselect={false}
          searchable
          required
          data-testid="select-destination"
          {...form.getInputProps("to")}
        />

        <CurrencySelection form={form} currencyOptions={currencyOptions} />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          data-testid="input-address"
          {...form.getInputProps("address")}
        />

        {form.values.to === "Ethereum" && form.values.from === "Hydration" && (
          <TextInput
            label="AssetHub address"
            placeholder="0x0000000"
            data-testid="input-ahaddress"
            {...form.getInputProps("ahAddress")}
          />
        )}

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

export default TransferForm;
