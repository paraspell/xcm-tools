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

  const { func, node, currencyType } = form.getValues();

  const showSymbolInput =
    func === "ASSET_ID" ||
    func === "DECIMALS" ||
    func == "HAS_SUPPORT" ||
    func === "BALANCE_FOREIGN" ||
    func === "ASSET_BALANCE" ||
    func === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
    func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    func === "TRANSFERABLE_AMOUNT" ||
    func === "EXISTENTIAL_DEPOSIT";

  const supportsCurrencyType =
    func === "BALANCE_FOREIGN" ||
    func === "ASSET_BALANCE" ||
    func === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
    func === "TRANSFERABLE_AMOUNT" ||
    func === "EXISTENTIAL_DEPOSIT";

  const showAddressInput =
    func === "BALANCE_FOREIGN" ||
    func === "BALANCE_NATIVE" ||
    func === "ASSET_BALANCE" ||
    func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    func === "MAX_FOREIGN_TRANSFERABLE_AMOUNT" ||
    func === "TRANSFERABLE_AMOUNT";

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
    func === "PARA_ID" ||
    func === "BALANCE_NATIVE" ||
    func === "BALANCE_FOREIGN" ||
    func === "ASSET_BALANCE" ||
    func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    func === "MAX_FOREIGN_TRANSFERABLE_AMOUNT";

  const supportsRelayChains =
    func === "ASSETS_OBJECT" ||
    func === "NATIVE_ASSETS" ||
    func === "BALANCE_NATIVE" ||
    func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" ||
    func === "EXISTENTIAL_DEPOSIT" ||
    func === "TRANSFERABLE_AMOUNT";

  const optionalCurrency =
    func === "MAX_NATIVE_TRANSFERABLE_AMOUNT" || func === "EXISTENTIAL_DEPOSIT";

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
    if (!nodeList.includes(node as (typeof nodeList)[0])) {
      form.setFieldValue("node", "Acala");
    }
  }, [nodeList, node]);

  useEffect(() => {
    if (showSymbolInput) {
      form.setFieldValue("currency", "");
      form.setFieldValue("currencyType", "symbol");
    }
  }, [func]);

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
            {(currencyType === "id" || currencyType === "symbol") && (
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
                    : currencyType === "id"
                      ? "Asset ID"
                      : "Symbol"
                }
                required={!optionalCurrency}
                data-testid="input-currency"
                {...form.getInputProps("currency")}
              />
            )}

            {currencyType === "multilocation" && (
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
