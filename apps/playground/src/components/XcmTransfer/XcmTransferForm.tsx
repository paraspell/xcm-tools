import {
  ActionIcon,
  Button,
  Checkbox,
  Fieldset,
  Group,
  Menu,
  Paper,
  Stack,
  TextInput,
  useComputedColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TAssetInfo, TChain, TSubstrateChain } from '@paraspell/sdk';
import { CHAINS, isChainEvm, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import {
  IconChevronDown,
  IconLocationCheck,
  IconLocationQuestion,
  IconPlus,
  IconTransfer,
  IconTrash,
} from '@tabler/icons-react';
import {
  parseAsBoolean,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import type { FC, FormEvent } from 'react';
import { useEffect } from 'react';
import { z } from 'zod';

import { DEFAULT_ADDRESS } from '../../constants';
import {
  useAutoFillWalletAddress,
  useCurrencyOptions,
  useFeeCurrencyOptions,
  useWallet,
} from '../../hooks';
import type { TSubmitType } from '../../types';
import { isValidPolkadotAddress, isValidWalletAddress } from '../../utils';
import {
  parseAsChain,
  parseAsRecipientAddress,
  parseAsSubstrateChain,
} from '../../utils/routes/parsers';
import { CurrencySelection } from '../common/CurrencySelection';
import { FeeAssetSelection } from '../common/FeeAssetSelection';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type TCurrencyEntry = {
  currencyOptionId: string;
  customCurrency: string;
  amount: string;
  isCustomCurrency: boolean;
  isMax?: boolean;
  customCurrencyType?: 'id' | 'symbol' | 'location' | 'overridenLocation';
  customCurrencySymbolSpecifier?:
    | 'auto'
    | 'native'
    | 'foreign'
    | 'foreignAbstract';
};

export type FormValues = {
  from: TSubstrateChain;
  to: TChain;
  currencies: TCurrencyEntry[];
  feeAsset: Omit<TCurrencyEntry, 'amount' | 'isMax'>;
  address: string;
  ahAddress: string;
  useApi: boolean;
  useXcmFormatCheck: boolean;
};

export type TCurrencyEntryTransformed = TCurrencyEntry & {
  currency?: TAssetInfo;
};

export type FormValuesTransformed = FormValues & {
  currencies: TCurrencyEntryTransformed[];
  transformedFeeAsset?: TCurrencyEntryTransformed;
};

type Props = {
  onSubmit: (values: FormValuesTransformed, submitType: TSubmitType) => void;
  loading: boolean;
  isBatchMode: boolean;
  initialValues?: FormValues;
  isVisible?: boolean;
};

const TCurrencyEntrySchema = z.object({
  currencyOptionId: z.string(),
  customCurrency: z.string(),
  amount: z.string(),
  isCustomCurrency: z.boolean(),
  isMax: z.boolean().optional(),
  customCurrencyType: z
    .enum(['id', 'symbol', 'location', 'overridenLocation'])
    .optional(),
  customCurrencySymbolSpecifier: z
    .enum(['auto', 'native', 'foreign', 'foreignAbstract'])
    .optional(),
});

export const FeeAssetSchema = TCurrencyEntrySchema.omit({
  amount: true,
  isMax: true,
});

const XcmTransferForm: FC<Props> = ({
  onSubmit,
  loading,
  isBatchMode,
  initialValues,
  isVisible = true,
}) => {
  const [queryState, setQueryState] = useQueryStates({
    from: parseAsSubstrateChain.withDefault('Astar'),
    to: parseAsChain.withDefault('Hydration'),
    currencies: parseAsNativeArrayOf(
      parseAsJson(TCurrencyEntrySchema),
    ).withDefault([
      {
        currencyOptionId: '',
        customCurrency: '',
        amount: '10',
        isCustomCurrency: false,
        isMax: false,
        customCurrencyType: 'id',
        customCurrencySymbolSpecifier: 'auto',
      },
    ]),
    feeAsset: parseAsJson(FeeAssetSchema).withDefault({
      currencyOptionId: '',
      customCurrency: '',
      isCustomCurrency: false,
      customCurrencyType: 'symbol',
      customCurrencySymbolSpecifier: 'auto',
    }),

    address: parseAsRecipientAddress.withDefault(DEFAULT_ADDRESS),
    ahAddress: parseAsString.withDefault(''),
    useApi: parseAsBoolean.withDefault(false),
    useXcmFormatCheck: parseAsBoolean.withDefault(false),
  });

  const form = useForm<FormValues>({
    initialValues: queryState,

    validate: {
      address: (value, values) => {
        if (!isValidWalletAddress(value)) {
          return 'Invalid address';
        }
        // Prevent Transfer to the same address when origin and destination networks are the same
        if (values.from === values.to && value === selectedAccount?.address) {
          return 'Sender and receiver cannot be the same address when origin and destination networks are the same, please enter a different address for the receiver.';
        }
        return null;
      },
      currencies: {
        currencyOptionId: (value, values, path) => {
          const index = Number(path.split('.')[1]);
          if (values.currencies[index].isCustomCurrency) {
            return values.currencies[index].customCurrency
              ? null
              : 'Custom currency is required';
          } else {
            return value ? null : 'Currency selection is required';
          }
        },
        customCurrency: (value, values, path) => {
          const index = Number(path.split('.')[1]);
          if (values.currencies[index].isCustomCurrency) {
            return value ? null : 'Custom currency is required';
          }
          return null;
        },
        amount: (value, values, path) => {
          // Skip validation when MAX is selected for this currency
          const index = Number(path.split('.')[1]);
          if (values.currencies?.[index]?.isMax) return null;
          return Number(value) > 0 ? null : 'Amount must be greater than 0';
        },
      },
      feeAsset(value, values) {
        return !value && values.currencies.length > 1
          ? 'Fee asset is required'
          : null;
      },
      ahAddress: (value) => {
        if (value.length === 0) return null;
        return isValidPolkadotAddress(value)
          ? null
          : 'Invalid Polkadot address';
      },
    },
  });

  useAutoFillWalletAddress(form, 'address');
  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  const { from, to, currencies, useApi } = form.getValues();

  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    from,
    to,
  );

  const { currencyOptions: feeCurrencyOptions, currencyMap: feeCurrencyMap } =
    useFeeCurrencyOptions(from);

  const transformCurrency = (
    entry: TCurrencyEntry,
    currencyMap: Record<string, TAssetInfo>,
  ) => {
    if (entry.isCustomCurrency) {
      // Custom currency doesn't map to currencyMap
      return { ...entry };
    }

    const currency = currencyMap[entry.currencyOptionId];

    if (!currency) {
      return { ...entry };
    }

    return { ...entry, currency };
  };

  const onSubmitInternal = (
    values: FormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TSubmitType = 'default',
  ) => {
    // If MAX is selected for a local transfer, convert amount to 'ALL'
    const normalizedValues: FormValues = {
      ...values,
      currencies: values.currencies.map((c) =>
        c.isMax ? { ...c, amount: 'ALL' } : c,
      ),
    };

    // Transform each currency entry
    const transformedCurrencies = normalizedValues.currencies.map((entry) =>
      transformCurrency(entry, currencyMap),
    );

    const transformedFeeAsset =
      normalizedValues.feeAsset.currencyOptionId ||
      normalizedValues.feeAsset.isCustomCurrency
        ? transformCurrency(
            normalizedValues.feeAsset as TCurrencyEntry,
            feeCurrencyMap,
          )
        : undefined;

    const transformedValues: FormValuesTransformed = {
      ...normalizedValues,
      currencies: transformedCurrencies,
      transformedFeeAsset,
    };

    if (
      submitType === 'dryRun' ||
      submitType === 'dryRunPreview' ||
      submitType === 'delete'
    ) {
      onSubmit(transformedValues, submitType);
      return;
    }

    onSubmit(transformedValues, initialValues ? 'update' : submitType);
  };

  const onSubmitInternalDryRun = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'dryRun');
    }
  };

  const onSubmitInternalDryRunPreview = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'dryRunPreview');
    }
  };

  const onSubmitInternalAddToBatch = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'addToBatch');
    }
  };

  useEffect(() => {
    if (isNotParaToPara && Object.keys(currencyMap).length === 1) {
      form.setFieldValue(
        'currencies.0.currencyOptionId',
        Object.keys(currencyMap)[0],
      );
    }
  }, [isNotParaToPara, currencyMap]);

  // Ensure that the fee asset is valid when the form values change
  useEffect(() => {
    const currentFeeAssetIsCustom = form.values.feeAsset.isCustomCurrency;
    const feeAssetOptionId = form.values.feeAsset.currencyOptionId;

    if (!currentFeeAssetIsCustom && feeAssetOptionId) {
      const isOptionStillValid = feeCurrencyOptions.some(
        (option) => option.value === feeAssetOptionId,
      );

      if (!isOptionStillValid) {
        form.setFieldValue('feeAsset.currencyOptionId', '');
      }
    }
  }, [from, feeCurrencyOptions, form.values.feeAsset.isCustomCurrency]);

  const onSwap = () => {
    const { from, to } = form.getValues();
    if (to !== 'Ethereum') {
      form.setFieldValue('from', to);
      form.setFieldValue('to', from);
    }
  };

  const {
    connectWallet,
    selectedAccount,
    isInitialized,
    isLoadingExtensions,
    setIsUseXcmApiSelected,
  } = useWallet();

  useEffect(() => {
    setIsUseXcmApiSelected(useApi);
  }, [useApi]);

  const onConnectWalletClick = () => void connectWallet();

  const getSubmitLabel = () => {
    if (initialValues) return 'Update transaction';
    return isBatchMode ? 'Submit batch' : 'Submit transaction';
  };

  const colorScheme = useComputedColorScheme();

  const feeAssetDisabled =
    form.values.currencies.length <= 1 &&
    from !== 'AssetHubPolkadot' &&
    from !== 'Hydration';

  const showAhAddress = isChainEvm(from) && isChainEvm(to) && from !== to;

  if (!isVisible) {
    return null;
  }

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the origin chain"
            data={SUBSTRATE_CHAINS}
            data-testid="select-origin"
            {...form.getInputProps('from')}
          />

          <ActionIcon
            variant="outline"
            style={{ margin: '0 auto', marginBottom: -12 }}
          >
            <IconTransfer
              size={24}
              style={{ rotate: '90deg' }}
              onClick={onSwap}
            />
          </ActionIcon>

          <ParachainSelect
            label="Destination"
            placeholder="Pick value"
            description="Select the destination chain"
            data={CHAINS}
            data-testid="select-destination"
            {...form.getInputProps('to')}
          />

          <Stack gap="md">
            {currencies.map((_, index) => (
              <Fieldset
                key={index}
                legend={
                  currencies.length > 1 ? `Asset ${index + 1}` : undefined
                }
                pos="relative"
              >
                <Group>
                  <Stack gap="xs" flex={1}>
                    <CurrencySelection
                      form={form}
                      index={index}
                      currencyOptions={currencyOptions}
                    />
                    <Group gap="xs" wrap="nowrap">
                      <TextInput
                        label="Amount"
                        rightSectionWidth={80}
                        rightSection={
                          <Group>
                            <Checkbox
                              label="MAX"
                              labelPosition="left"
                              size={currencies.length > 1 ? 'xs' : 'sm'}
                              {...form.getInputProps(
                                `currencies.${index}.isMax`,
                                {
                                  type: 'checkbox',
                                },
                              )}
                            />
                          </Group>
                        }
                        placeholder="0"
                        size={currencies.length > 1 ? 'xs' : 'sm'}
                        required
                        disabled={Boolean(
                          form.values.currencies?.[index]?.isMax,
                        )}
                        data-testid={`input-amount-${index}`}
                        {...form.getInputProps(`currencies.${index}.amount`)}
                        value={
                          form.values.currencies?.[index]?.isMax
                            ? 'MAX'
                            : form.values.currencies?.[index]?.amount
                        }
                        style={{ flex: 1 }}
                      />
                    </Group>
                  </Stack>
                  {form.values.currencies.length > 1 && (
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      bg={colorScheme === 'light' ? 'white' : 'dark.7'}
                      pos="absolute"
                      right={20}
                      top={-25}
                      onClick={() => form.removeListItem('currencies', index)}
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
                form.insertListItem('currencies', {
                  currencyOptionId: '',
                  customCurrency: '',
                  amount: '10000000000000000000',
                  isCustomCurrency: false,
                  isMax: false,
                  customCurrencyType: 'id',
                })
              }
            >
              Add another asset
            </Button>
          </Stack>

          <FeeAssetSelection
            disabled={feeAssetDisabled}
            form={form}
            currencyOptions={feeCurrencyOptions}
          />

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            required
            data-testid="input-address"
            {...form.getInputProps('address')}
          />

          {showAhAddress && (
            <TextInput
              label="AssetHub address"
              description="SS58 address"
              placeholder="Enter address"
              required
              data-testid="input-address"
              {...form.getInputProps('ahAddress')}
            />
          )}

          <Stack gap="xs">
            <XcmApiCheckbox
              {...form.getInputProps('useApi', { type: 'checkbox' })}
            />

            <Checkbox
              label="Use XCM Format Check ✅"
              {...form.getInputProps('useXcmFormatCheck', { type: 'checkbox' })}
            />
          </Stack>

          {selectedAccount ? (
            <Button.Group>
              <Button
                type="submit"
                loading={loading}
                flex={1}
                data-testid="submit"
              >
                {getSubmitLabel()}
              </Button>

              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Button
                    style={{
                      borderLeft: '1px solid #ff93c0',
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

                  <Menu.Item
                    leftSection={<IconLocationQuestion size={16} />}
                    onClick={onSubmitInternalDryRunPreview}
                  >
                    Dry run preview
                  </Menu.Item>

                  {!initialValues && (
                    <Menu.Item
                      leftSection={<IconPlus size={16} />}
                      onClick={onSubmitInternalAddToBatch}
                    >
                      Add to batch
                    </Menu.Item>
                  )}

                  {initialValues && (
                    <Menu.Item
                      leftSection={<IconTrash size={16} />}
                      onClick={() =>
                        onSubmitInternal(form.getValues(), undefined, 'delete')
                      }
                    >
                      Delete from batch
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Button.Group>
          ) : (
            <Button
              onClick={onConnectWalletClick}
              data-testid="btn-connect-wallet"
              loading={!isInitialized || isLoadingExtensions}
            >
              Connect wallet
            </Button>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default XcmTransferForm;
