import { useForm } from "@mantine/form";
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
import type { TNode } from "@paraspell/sdk";
import {
  NODE_NAMES,
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from "@paraspell/sdk";
import type { TAssetsQuery } from "../../types";
import { ASSET_QUERIES } from "../../consts";

export type FormValues = {
  func: TAssetsQuery;
  node: TNode;
  currency: string;
  address: string;
  useApi: boolean;
  currencyType?: "id" | "symbol" | "multilocation";
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
      currency: "GLMR",
      address: "",
      useApi: false,
      currencyType: "symbol",
    },
  });

  const funcVal = form.values.func;

  const showSymbolInput =
    funcVal === "ASSET_ID" ||
    funcVal === "DECIMALS" ||
    funcVal == "HAS_SUPPORT" ||
    funcVal === "BALANCE_FOREIGN" ||
    funcVal === "ASSET_BALANCE" ||
    funcVal === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
    funcVal === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    funcVal === "TRANSFERABLE_AMOUNT" ||
    funcVal === "EXISTENTIAL_DEPOSIT";

  const supportsCurrencyType =
    funcVal === "BALANCE_FOREIGN" ||
    funcVal === "ASSET_BALANCE" ||
    funcVal === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
    funcVal === "TRANSFERABLE_AMOUNT" ||
    funcVal === "EXISTENTIAL_DEPOSIT";

  const showAddressInput =
    funcVal === "BALANCE_FOREIGN" ||
    funcVal === "BALANCE_NATIVE" ||
    funcVal === "ASSET_BALANCE" ||
    funcVal === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    funcVal === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
    funcVal === "TRANSFERABLE_AMOUNT";

  const onSubmitInternal = (formValues: FormValues) => {
    const { func } = formValues;
    const usesSymbol =
      func === "ASSET_ID" || func === "DECIMALS" || func === "HAS_SUPPORT";
    return onSubmit({
      ...formValues,
      ...(usesSymbol && { symbol: formValues.currency }),
    });
  };

  const notSupportsEthereum =
    funcVal === "PARA_ID" ||
    funcVal === "BALANCE_NATIVE" ||
    funcVal === "BALANCE_FOREIGN" ||
    funcVal === "ASSET_BALANCE" ||
    funcVal === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    funcVal === "MAX_FOREIGN_TRANSFERABLE_AMOUNT";

  const supportsRelayChains =
    funcVal === "ASSETS_OBJECT" ||
    funcVal === "NATIVE_ASSETS" ||
    funcVal === "BALANCE_NATIVE" ||
    funcVal === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    funcVal === "EXISTENTIAL_DEPOSIT" ||
    funcVal === "TRANSFERABLE_AMOUNT";

  const optionalCurrency =
    funcVal === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    funcVal === "EXISTENTIAL_DEPOSIT";

  const getNodeList = () => {
    if (notSupportsEthereum && supportsRelayChains) {
      return NODES_WITH_RELAY_CHAINS_DOT_KSM;
    }

    if (notSupportsEthereum && !supportsRelayChains) {
      return NODE_NAMES_DOT_KSM;
    }

    if (!notSupportsEthereum && supportsRelayChains) {
      return NODES_WITH_RELAY_CHAINS;
    }

    return NODE_NAMES;
  };

  const nodeList = getNodeList();

  useEffect(() => {
    if (!nodeList.includes(form.values.node as (typeof nodeList)[0])) {
      form.setFieldValue("node", "Acala");
    }
  }, [nodeList, form.values.node]);

  useEffect(() => {
    if (showSymbolInput) {
      form.setFieldValue("currency", "");
      form.setFieldValue("currencyType", "symbol");
    }
  }, [form.values.func]);

  const onSelectCurrencyTypeClick = () => {
    form.setFieldValue("currency", "");
  };

  return (
    <form onSubmit={form.onSubmit(onSubmitInternal)}>
      <Stack>
        <Select
          label="Function"
          placeholder="Pick value"
          data={ASSET_QUERIES}
          searchable
          required
          allowDeselect={false}
          data-testid="select-func"
          {...form.getInputProps("func")}
        />

        <Select
          label="Node"
          placeholder="Pick value"
          data={nodeList}
          searchable
          required
          allowDeselect={false}
          data-testid="select-node"
          {...form.getInputProps("node")}
        />

        {showSymbolInput && (
          <Stack gap="xs">
            {(form.values.currencyType === "id" ||
              form.values.currencyType === "symbol") && (
              <TextInput
                flex={1}
                label={
                  supportsCurrencyType
                    ? `Currency ${optionalCurrency ? "(optional)" : ""}`
                    : `Symbol ${optionalCurrency ? "(optional)" : ""}`
                }
                placeholder={
                  supportsCurrencyType
                    ? "GLMR"
                    : form.values.currencyType === "id"
                      ? "Asset ID"
                      : "Symbol"
                }
                required={!optionalCurrency}
                data-testid="input-currency"
                {...form.getInputProps("currency")}
              />
            )}

            {form.values.currencyType === "multilocation" && (
              <JsonInput
                placeholder="Input Multi-Location JSON or interior junctions JSON to search for and identify the asset"
                formatOnBlur
                autosize
                minRows={10}
                {...form.getInputProps("currency")}
              />
            )}

            {supportsCurrencyType && (
              <SegmentedControl
                size="xs"
                pb={8}
                data={[
                  { label: "Asset ID", value: "id" },
                  { label: "Symbol", value: "symbol" },
                  { label: "Multi-location", value: "multilocation" },
                ]}
                onClick={onSelectCurrencyTypeClick}
                data-testid="currency-type"
                {...form.getInputProps("currencyType")}
              />
            )}
          </Stack>
        )}

        {showAddressInput && (
          <TextInput
            label="Address"
            placeholder="0x0000000"
            required
            data-testid="address-input"
            {...form.getInputProps("address")}
          />
        )}

        <Checkbox
          label="Use XCM API"
          {...form.getInputProps("useApi")}
          data-testid="checkbox-api"
        />

        <Button type="submit" loading={loading} data-testid="submit">
          Submit
        </Button>
      </Stack>
    </form>
  );
};

export default AssetsForm;
