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
  IconArrowBarDown,
  IconArrowBarToRight,
  IconArrowBarUp,
  IconChecks,
  IconChevronDown,
  IconCoin,
  IconCoinFilled,
  IconFileInfo,
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
import type { FC } from 'react';
import { useEffect } from 'react';
import z from 'zod';

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
import {
  type AdvancedOptions,
  AdvancedOptionsAccordion,
  validateEndpoint,
} from '../AdvancedOptionsAccordion/AdvancedOptionsAccordion';
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
} & AdvancedOptions;

export type TCurrencyEntryTransformed = TCurrencyEntry & {
  currency?: TAssetInfo;
};

export type FormValuesTransformed = Omit<FormValues, 'currencies'> & {
  currencies: TCurrencyEntryTransformed[];
  transformedFeeAsset?: TCurrencyEntryTransformed;
};

type Props = {
  onSubmit: (values: FormValuesTransformed, submitType: TSubmitType) => void;
  loading: boolean;
  initialValues?: FormValues;
  isVisible?: boolean;
  advancedOptions?: AdvancedOptions;
  onAdvancedOptionsChange?: (options: AdvancedOptions) => void;
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

const XcmUtilsForm: FC<Props> = ({
  onSubmit,
  loading,
  initialValues,
  isVisible = true,
  advancedOptions,
  onAdvancedOptionsChange,
}) => {
  const [queryState, setQueryState] = useQueryStates(
    {
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
    },
    { clearOnDefault: false },
  );

  const form = useForm<FormValues>({
    initialValues: initialValues
      ? { ...initialValues, ...advancedOptions }
      : { ...queryState, ...advancedOptions },

    validate: {
      address: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
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
      customEndpoints: {
        endpoints: {
          value: (value) => {
            return validateEndpoint(value) ? null : 'Endpoint is not valid';
          },
        },
      },
    },
  });

  useAutoFillWalletAddress(form, 'address');

  useEffect(() => {
    const {
      xcmVersion,
      isDevelopment,
      abstractDecimals,
      pallet,
      method,
      customEndpoints,
      ...restValues
    } = form.values;
    void setQueryState(restValues);
  }, [form.values, setQueryState]);

  useEffect(() => {
    const {
      xcmVersion,
      isDevelopment,
      abstractDecimals,
      pallet,
      method,
      customEndpoints,
    } = form.values;
    void onAdvancedOptionsChange?.({
      xcmVersion,
      isDevelopment,
      abstractDecimals,
      pallet,
      method,
      customEndpoints,
    });
  }, [
    form.values.xcmVersion,
    form.values.isDevelopment,
    form.values.abstractDecimals,
    form.values.pallet,
    form.values.method,
    form.values.customEndpoints,
  ]);

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

  const onSubmitInternal = (values: FormValues, submitType: TSubmitType) => {
    const normalizedValues: FormValues = {
      ...values,
      currencies: values.currencies.map((entry) =>
        entry.isMax ? { ...entry, amount: 'ALL' } : entry,
      ),
    };

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
    onSubmit(transformedValues, submitType);
  };

  const validateEvmOriginRequirements = () => {
    if (!isChainEvm(form.values.from)) {
      return true;
    }

    if (!form.values.ahAddress) {
      form.setFieldError(
        'ahAddress',
        'AssetHub address is required for EVM origin.',
      );
      return false;
    }

    if (!isValidPolkadotAddress(form.values.ahAddress)) {
      form.setFieldError('ahAddress', 'Invalid Polkadot address');
      return false;
    }

    return true;
  };

  const onSubmitGetXcmFee = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getXcmFee');
    }
  };

  const onSubmitGetXcmFeeEstimate = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getXcmFeeEstimate');
    }
  };

  const onSubmitGetOriginXcmFee = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getOriginXcmFee');
    }
  };

  const onSubmitGetOriginXcmFeeEstimate = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getOriginXcmFeeEstimate');
    }
  };

  const onSubmitGetTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getTransferableAmount');
    }
  };

  const onSubmitGetMinTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getMinTransferableAmount');
    }
  };

  const onSubmitVerifyEdOnDestination = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'verifyEdOnDestination');
    }
  };

  const onSubmitGetTransferInfo = () => {
    form.validate();

    if (!validateEvmOriginRequirements()) return;

    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getTransferInfo');
    }
  };

  const onSubmitGetReceivableAmount = () => {
    form.validate();

    if (!validateEvmOriginRequirements()) return;

    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getReceivableAmount');
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

  useEffect(() => {
    setIsUseXcmApiSelected(useApi);
  }, [useApi]);

  const onSwap = () => {
    const { from: currentFrom, to: currentTo } = form.getValues();
    if (currentTo !== 'Ethereum') {
      form.setFieldValue('from', currentTo);
      form.setFieldValue('to', currentFrom);
    }
  };

  const {
    connectWallet,
    selectedAccount,
    isInitialized,
    isLoadingExtensions,
    setIsUseXcmApiSelected,
  } = useWallet();

  const onConnectWalletClick = () => void connectWallet();

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
      <form>
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
            onClick={onSwap}
          >
            <IconTransfer size={24} style={{ rotate: '90deg' }} />
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
                      disabled={Boolean(form.values.currencies?.[index]?.isMax)}
                      data-testid={`input-amount-${index}`}
                      {...form.getInputProps(`currencies.${index}.amount`)}
                      value={
                        form.values.currencies?.[index]?.isMax
                          ? 'MAX'
                          : form.values.currencies?.[index]?.amount
                      }
                    />
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
                  customCurrencySymbolSpecifier: 'auto',
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

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          <AdvancedOptionsAccordion form={form} />

          {selectedAccount ? (
            <Menu shadow="md" width={250} position="bottom-end">
              <Menu.Target>
                <Button
                  data-testid="btn-actions"
                  leftSection={<IconChevronDown />}
                  loading={loading}
                  variant="outline"
                  fullWidth
                >
                  Actions
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconCoinFilled size={16} />}
                  onClick={onSubmitGetXcmFee}
                >
                  Get XCM Fee
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconCoin size={16} />}
                  onClick={onSubmitGetXcmFeeEstimate}
                >
                  Get XCM Fee Estimate
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconCoinFilled size={16} />}
                  onClick={onSubmitGetOriginXcmFee}
                >
                  Get Origin XCM Fee
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconCoin size={16} />}
                  onClick={onSubmitGetOriginXcmFeeEstimate}
                >
                  Get Origin XCM Fee Estimate
                </Menu.Item>

                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconArrowBarUp size={16} />}
                  onClick={onSubmitGetTransferableAmount}
                >
                  Get Transferable Amount
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowBarDown size={16} />}
                  onClick={onSubmitGetMinTransferableAmount}
                >
                  Get Min Transferable Amount
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconChecks size={16} />}
                  onClick={onSubmitVerifyEdOnDestination}
                >
                  Verify ED on Destination
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-item-transfer-info"
                  leftSection={<IconFileInfo size={16} />}
                  onClick={onSubmitGetTransferInfo}
                >
                  Get Transfer Info
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowBarToRight size={16} />}
                  onClick={onSubmitGetReceivableAmount}
                >
                  Get Receivable Amount
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button
              onClick={onConnectWalletClick}
              data-testid="btn-connect-wallet"
              loading={!isInitialized || isLoadingExtensions}
              fullWidth
            >
              Connect Wallet
            </Button>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default XcmUtilsForm;
