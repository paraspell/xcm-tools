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
import {
  CHAINS,
  isChainEvm,
  isExternalChain,
  SUBSTRATE_CHAINS,
} from '@paraspell/sdk';
import {
  Icon123,
  IconArrowBarDown,
  IconArrowBarToRight,
  IconArrowBarUp,
  IconChecks,
  IconChevronDown,
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
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import type { FC } from 'react';
import { useEffect } from 'react';

import {
  DEFAULT_ADDRESS,
  DEFAULT_CURRENCY_ENTRY,
  DEFAULT_CURRENCY_ENTRY_BASE,
  MAIN_FORM_NAME,
} from '../../constants';
import {
  useCurrencyOptions,
  useFeeCurrencyOptions,
  useRouterCurrencyOptions,
  useWallet,
} from '../../hooks';
import {
  advancedOptionsParsers,
  CurrencyEntrySchema,
  FeeAssetSchema,
  parseAsWalletAddress,
  swapOptionsParsers,
  transactOptionsParsers,
} from '../../parsers';
import type {
  TFormValues,
  TFormValuesTransformed,
  TSubmitType,
} from '../../types';
import {
  isValidPolkadotAddress,
  resolveCurrencyAsset,
  resolveExchange,
  validateCustomEndpoint,
  validateTransferAddress,
} from '../../utils';
import { AdvancedOptions } from '../AdvancedOptions';
import { CurrencySelection } from '../common/CurrencySelection';
import { KeepAliveCheckbox } from '../common/KeepAliveCheckbox';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { Swap } from '../Swap/Swap';
import { AddressTooltip } from '../Tooltip';
import { Transact } from '../Transact/Transact';

type Props = {
  onSubmit: (values: TFormValuesTransformed, submitType: TSubmitType) => void;
  loading: boolean;
  initialValues?: TFormValues;
  isVisible?: boolean;
};

export const XcmUtilsForm: FC<Props> = ({
  onSubmit,
  loading,
  initialValues,
  isVisible = true,
}) => {
  const {
    connectWallet,
    selectedAccount,
    isInitialized,
    isLoadingExtensions,
    setIsUseXcmApiSelected,
    setSourceChainForLedger,
  } = useWallet();

  const [queryState, setQueryState] = useQueryStates(
    {
      from: parseAsStringLiteral(SUBSTRATE_CHAINS).withDefault('Astar'),
      to: parseAsStringLiteral(CHAINS).withDefault('Hydration'),
      currencies: parseAsNativeArrayOf(
        parseAsJson(CurrencyEntrySchema),
      ).withDefault([DEFAULT_CURRENCY_ENTRY]),
      feeAsset: parseAsJson(FeeAssetSchema).withDefault(
        DEFAULT_CURRENCY_ENTRY_BASE,
      ),
      address: parseAsWalletAddress.withDefault(
        selectedAccount?.address ?? DEFAULT_ADDRESS,
      ),
      ahAddress: parseAsString.withDefault(''),
      useApi: parseAsBoolean.withDefault(false),
      keepAlive: parseAsBoolean.withDefault(true),
      ...transactOptionsParsers,
      ...swapOptionsParsers,
      ...advancedOptionsParsers,
    },
    { clearOnDefault: false },
  );

  const form = useForm<TFormValues>({
    name: MAIN_FORM_NAME,
    initialValues: initialValues ?? queryState,
    transformValues: (values) => {
      const { from, to, keepAlive, swapOptions } = values;
      return {
        ...values,
        // Use keepAlive only for local transfers
        keepAlive: from === to && !swapOptions.currencyTo ? keepAlive : false,
      };
    },
    validate: {
      address: (value, values) =>
        validateTransferAddress(value, values, selectedAccount?.address),
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
      apiOverrides: { endpoints: { url: validateCustomEndpoint } },
    },
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  useEffect(() => {
    setSourceChainForLedger(form.values.from);
  }, [form.values.from, setSourceChainForLedger]);

  const { from, to, currencies, feeAsset, useApi } = form.getValues();

  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    from,
    to,
  );

  const { currencyOptions: feeCurrencyOptions, currencyMap: feeCurrencyMap } =
    useFeeCurrencyOptions(from);

  const { currencyToMap: swapCurrencyToMap } = useRouterCurrencyOptions(
    from,
    resolveExchange(form.values.swapOptions.exchange),
    to,
  );

  const onSubmitInternal = (values: TFormValues, submitType: TSubmitType) => {
    const normalizedValues = {
      ...values,
      currencies: values.currencies.map((entry) =>
        entry.isMax ? { ...entry, amount: 'ALL' } : entry,
      ),
    };

    const transformedCurrencies = normalizedValues.currencies.map((entry) =>
      resolveCurrencyAsset(entry, currencyMap),
    );

    const transformedFeeAsset =
      normalizedValues.feeAsset.currencyOptionId ||
      normalizedValues.feeAsset.isCustomCurrency
        ? resolveCurrencyAsset(normalizedValues.feeAsset, feeCurrencyMap)
        : undefined;

    const { currencyTo } = normalizedValues.swapOptions;
    const transformedCurrencyTo =
      currencyTo.currencyOptionId || currencyTo.isCustomCurrency
        ? resolveCurrencyAsset(currencyTo, swapCurrencyToMap)
        : undefined;

    const transformedValues: TFormValuesTransformed = {
      ...normalizedValues,
      currencies: transformedCurrencies,
      transformedFeeAsset,
      transformedCurrencyTo,
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
      onSubmitInternal(form.getTransformedValues(), 'getXcmFee');
    }
  };

  const onSubmitGetOriginXcmFee = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'getOriginXcmFee');
    }
  };

  const onSubmitGetTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'getTransferableAmount');
    }
  };

  const onSubmitGetMinTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'getMinTransferableAmount');
    }
  };

  const onSubmitVerifyEdOnDestination = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'verifyEdOnDestination');
    }
  };

  const onSubmitGetTransferInfo = () => {
    form.validate();

    if (!validateEvmOriginRequirements()) return;

    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'getTransferInfo');
    }
  };

  const onSubmitGetReceivableAmount = () => {
    form.validate();

    if (!validateEvmOriginRequirements()) return;

    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'getReceivableAmount');
    }
  };

  const onSubmitGetBestAmountOut = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), 'getBestAmountOut');
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
    if (!isExternalChain(currentTo)) {
      form.setFieldValue('from', currentTo);
      form.setFieldValue('to', currentFrom);
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const colorScheme = useComputedColorScheme();

  const feeAssetDisabled =
    form.values.currencies.length <= 1 &&
    from !== 'AssetHubPolkadot' &&
    from !== 'Hydration';

  const showAhAddress = isChainEvm(from) && isChainEvm(to) && from !== to;

  const isLocalTransfer = from === to;

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
                      fieldPath={`currencies.${index}`}
                      fieldValue={currencies[index]}
                      showOverrideLocation={currencies.length === 1}
                      currencyOptions={currencyOptions}
                      size={currencies.length > 1 ? 'xs' : 'sm'}
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
                form.insertListItem('currencies', DEFAULT_CURRENCY_ENTRY)
              }
            >
              Add another asset
            </Button>
          </Stack>

          <CurrencySelection
            form={form}
            fieldPath="feeAsset"
            label="Fee asset"
            description="This asset will be used to pay fees"
            fieldValue={feeAsset}
            currencyOptions={feeCurrencyOptions}
            disabled={feeAssetDisabled}
            required={false}
          />

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            rightSection={<AddressTooltip />}
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
            <Swap form={form} />
            <Transact form={form} />
          </Stack>

          <Group gap="lg">
            <XcmApiCheckbox
              {...form.getInputProps('useApi', { type: 'checkbox' })}
            />
            <KeepAliveCheckbox
              display={isLocalTransfer ? 'block' : 'none'}
              {...form.getInputProps('keepAlive', { type: 'checkbox' })}
            />
          </Group>

          <AdvancedOptions form={form} />

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
                  leftSection={<IconCoinFilled size={16} />}
                  onClick={onSubmitGetOriginXcmFee}
                >
                  Get Origin XCM Fee
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
                <Menu.Item
                  leftSection={<Icon123 size={16} />}
                  onClick={onSubmitGetBestAmountOut}
                >
                  Get Best Amount Out
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
