import { useForm } from "@mantine/form";
import { isValidWalletAddress } from "../utils";
import { useEffect, type FC } from "react";
import {
  Button,
  Checkbox,
  JsonInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import type { TNodeDotKsmWithRelayChains } from "@paraspell/sdk";
import {
  getRelayChainSymbol,
  isRelayChain,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from "@paraspell/sdk";

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeDotKsmWithRelayChains;
  currency: string;
  address: string;
  destinationAddress: string;
  amount: string;
  useApi: boolean;
  customCurrencyType?: "id" | "symbol" | "multilocation";
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

  const { from, to, customCurrencyType } = form.getValues();

  const isNotParaToPara = isRelayChain(from) || isRelayChain(to);

  const onSelectCurrencyTypeClick = () => {
    form.setFieldValue("currency", "");
  };

  useEffect(() => {
    if (isNotParaToPara) {
      form.setFieldValue("customCurrencyType", "symbol");
      if (isRelayChain(from)) {
        form.setFieldValue("currency", getRelayChainSymbol(from));
      }
      if (isRelayChain(to)) {
        form.setFieldValue("currency", getRelayChainSymbol(to));
      }
    }
  }, [from, to]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
          searchable
          required
          allowDeselect={false}
          data-testid="select-origin"
          {...form.getInputProps("from")}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
          searchable
          required
          allowDeselect={false}
          data-testid="select-destination"
          {...form.getInputProps("to")}
        />

        <Stack gap="xs">
          {(customCurrencyType === "id" || customCurrencyType === "symbol") && (
            <TextInput
              disabled={isNotParaToPara}
              flex={1}
              label="Currency"
              placeholder={customCurrencyType === "id" ? "Asset ID" : "Symbol"}
              required
              data-testid="input-currency"
              {...form.getInputProps("currency")}
            />
          )}

          {customCurrencyType === "multilocation" && (
            <JsonInput
              placeholder="Input Multi-Location JSON or interior junctions JSON to search for and identify the asset"
              formatOnBlur
              autosize
              minRows={10}
              {...form.getInputProps("currency")}
            />
          )}

          <SegmentedControl
            disabled={isNotParaToPara}
            onClick={onSelectCurrencyTypeClick}
            size="xs"
            pb={8}
            data={[
              { label: "Asset ID", value: "id" },
              { label: "Symbol", value: "symbol" },
              { label: "Multi-location", value: "multilocation" },
            ]}
            {...form.getInputProps("customCurrencyType")}
          />
        </Stack>

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
