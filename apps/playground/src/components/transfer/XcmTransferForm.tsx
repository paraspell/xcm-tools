import { useForm } from "@mantine/form";
import { isValidWalletAddress } from "../../utils";
import type { FC, FormEvent } from "react";
import { useEffect } from "react";
import {
  ActionIcon,
  Button,
  Checkbox,
  Fieldset,
  Group,
  Menu,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import type {
  TAsset,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from "@paraspell/sdk";
import {
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from "@paraspell/sdk";
import useCurrencyOptions from "../../hooks/useCurrencyOptions";
import CurrencySelection from "../CurrencySelection";
import {
  IconChevronDown,
  IconLocationCheck,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

export type TCurrencyEntry = {
  currencyOptionId: string;
  customCurrency: string;
  amount: string;
  isFeeAsset: boolean;
  isCustomCurrency: boolean;
  customCurrencyType?:
    | "id"
    | "symbol"
    | "multilocation"
    | "overridenMultilocation";
};

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeWithRelayChains;
  currencies: TCurrencyEntry[];
  address: string;
  ahAddress: string;
  useApi: boolean;
};

export type TCurrencyEntryTransformed = TCurrencyEntry & { currency?: TAsset };

export type FormValuesTransformed = FormValues & {
  currencies: TCurrencyEntryTransformed[];
};

type Props = {
  onSubmit: (values: FormValuesTransformed, isDryRun: boolean) => void;
  loading: boolean;
};

const XcmTransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: "Astar",
      to: "Moonbeam",
      currencies: [
        {
          currencyOptionId: "",
          customCurrency: "",
          amount: "10000000000000000000",
          isFeeAsset: false,
          isCustomCurrency: false,
          customCurrencyType: "id",
        },
      ],
      address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
      ahAddress: "",
      useApi: false,
    },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : "Invalid address",
      currencies: {
        currencyOptionId: (value, values, path) => {
          const index = Number(path.split(".")[1]);
          if (values.currencies[index].isCustomCurrency) {
            return values.currencies[index].customCurrency
              ? null
              : "Custom currency is required";
          } else {
            return value ? null : "Currency selection is required";
          }
        },
        customCurrency: (value, values, path) => {
          const index = Number(path.split(".")[1]);
          if (values.currencies[index].isCustomCurrency) {
            return value ? null : "Custom currency is required";
          }
          return null;
        },
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

  const { from, to, currencies } = form.getValues();

  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    from,
    to,
  );

  const onSubmitInternal = (
    values: FormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    isDryRun = false,
  ) => {
    // Transform each currency entry
    const transformedCurrencies = values.currencies.map((currEntry) => {
      if (currEntry.isCustomCurrency) {
        // Custom currency doesn't map to currencyMap
        return { ...currEntry };
      }

      const currency = currencyMap[currEntry.currencyOptionId];

      if (!currency) {
        return { ...currEntry };
      }

      return { ...currEntry, currency };
    });

    const transformedValues: FormValuesTransformed = {
      ...values,
      currencies: transformedCurrencies,
    };

    onSubmit(transformedValues, isDryRun);
  };

  const onSubmitInternalDryRun = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, true);
    }
  };

  useEffect(() => {
    if (isNotParaToPara && Object.keys(currencyMap).length === 1) {
      form.setFieldValue(
        "currencies.0.currencyOptionId",
        Object.keys(currencyMap)[0],
      );
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

        <Stack gap="md">
          {currencies.map((_, index) => (
            <Fieldset
              key={index}
              legend={currencies.length > 1 ? `Asset ${index + 1}` : undefined}
              pos="relative"
            >
              <Group>
                <Stack gap={4} flex={1}>
                  <CurrencySelection
                    form={form}
                    index={index}
                    currencyOptions={currencyOptions}
                  />
                  <TextInput
                    label="Amount"
                    placeholder="0"
                    size={currencies.length > 1 ? "xs" : "sm"}
                    required
                    data-testid={`input-amount-${index}`}
                    {...form.getInputProps(`currencies.${index}.amount`)}
                  />
                </Stack>
                {form.values.currencies.length > 1 && (
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    bg="white"
                    pos="absolute"
                    right={20}
                    top={-25}
                    onClick={() => form.removeListItem("currencies", index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>
            </Fieldset>
          ))}

          <Button
            variant="transparent"
            size="compact-xs"
            leftSection={<IconPlus size={16} />}
            onClick={() =>
              form.insertListItem("currencies", {
                currencyOptionId: "",
                customCurrency: "",
                amount: "10000000000000000000",
                isCustomCurrency: false,
                customCurrencyType: "id",
              })
            }
          >
            Add another asset
          </Button>
        </Stack>

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

        <Checkbox
          label="Use XCM API"
          {...form.getInputProps("useApi")}
          data-testid="checkbox-api"
        />

        <Button.Group>
          <Button type="submit" loading={loading} data-testid="submit" flex={1}>
            Submit transaction
          </Button>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Button
                style={{
                  borderLeft: "1px solid #ff93c0",
                }}
              >
                <IconChevronDown />
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconLocationCheck size={16} />}
                onClick={onSubmitInternalDryRun}
              >
                Dry run
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Button.Group>
      </Stack>
    </form>
  );
};

export default XcmTransferForm;
