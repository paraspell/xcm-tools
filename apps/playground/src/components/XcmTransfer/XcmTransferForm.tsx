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
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import type { FC, FormEvent } from 'react';
import { useCallback, useEffect } from 'react';

import {
  DEFAULT_ADDRESS,
  DEFAULT_CURRENCY_ENTRY,
  DEFAULT_CURRENCY_ENTRY_BASE,
  MAIN_FORM_NAME,
} from '../../constants';
import {
  useActiveCurrencyOptions,
  useFeeCurrencyOptions,
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
  validateCustomEndpoint,
  validateTransferAddress,
} from '../../utils';
import { AdvancedOptions } from '../AdvancedOptions';
import { CurrencySelection } from '../common/CurrencySelection';
import { KeepAliveCheckbox } from '../common/KeepAliveCheckbox';
import { SubmitWarningAlert } from '../common/SubmitWarningAlert';
import {
  TransferWarningModal,
  useTransferWarning,
} from '../common/TransferWarningModal';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { Swap } from '../Swap/Swap';
import { AddressTooltip } from '../Tooltip';
import { Transact } from '../Transact/Transact';

type Props = {
  onSubmit: (values: TFormValuesTransformed, submitType: TSubmitType) => void;
  loading: boolean;
  isBatchMode: boolean;
  initialValues?: TFormValues;
  isVisible?: boolean;
};

export const XcmTransferForm: FC<Props> = ({
  onSubmit,
  loading,
  isBatchMode,
  initialValues,
  isVisible = true,
}) => {
  const { connectWallet, selectedAccount, isInitialized, isLoadingExtensions } =
    useWallet();

  const { warningOpened, warningOnClose, warningOnConfirm, guardTransfer } =
    useTransferWarning();

  const [queryState, setQueryState] = useQueryStates({
    from: parseAsStringLiteral(SUBSTRATE_CHAINS).withDefault('Astar'),
    to: parseAsStringLiteral(CHAINS).withDefault('Hydration'),
    currencies: parseAsNativeArrayOf(
      parseAsJson(CurrencyEntrySchema),
    ).withDefault([DEFAULT_CURRENCY_ENTRY]),
    feeAsset: parseAsJson(FeeAssetSchema).withDefault(
      DEFAULT_CURRENCY_ENTRY_BASE,
    ),
    recipient: parseAsWalletAddress.withDefault(
      selectedAccount?.address ?? DEFAULT_ADDRESS,
    ),
    ahAddress: parseAsString.withDefault(''),
    useApi: parseAsBoolean.withDefault(false),
    keepAlive: parseAsBoolean.withDefault(true),
    ...transactOptionsParsers,
    ...swapOptionsParsers,
    ...advancedOptionsParsers,
  });

  const form = useForm<TFormValues>({
    name: MAIN_FORM_NAME,
    initialValues: initialValues ?? queryState,
    transformValues: (values) => {
      const { from, to, keepAlive, swapOptions } = values;
      return {
        ...values,
        // Use keepAlive only for local transfers
        keepAlive:
          from === to && !swapOptions.currencyTo.currencyOptionId
            ? keepAlive
            : false,
      };
    },
    validate: {
      recipient: (value, values) =>
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
      apiOverrides: { endpoints: { url: validateCustomEndpoint } },
    },
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  const { from, to, currencies, feeAsset } = form.getValues();

  const {
    activeCurrencyOptions,
    activeCurrencyMap,
    currencyKey,
    isNotParaToPara,
    currencyMap,
    swapCurrencyToMap,
  } = useActiveCurrencyOptions(
    form,
    from,
    to,
    form.values.swapOptions.exchange,
  );

  const { currencyOptions: feeCurrencyOptions, currencyMap: feeCurrencyMap } =
    useFeeCurrencyOptions(from);

  const resolveAndSubmit = useCallback(
    (values: TFormValues, submitType: TSubmitType) => {
      // If MAX is selected for a local transfer, convert amount to 'ALL'
      const normalizedValues = {
        ...values,
        currencies: values.currencies.map((c) =>
          c.isMax ? { ...c, amount: 'ALL' } : c,
        ),
      };

      // Transform each currency entry
      const transformedCurrencies = normalizedValues.currencies.map((entry) =>
        resolveCurrencyAsset(entry, activeCurrencyMap),
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

      if (
        submitType === 'dryRun' ||
        submitType === 'dryRunPreview' ||
        submitType === 'delete'
      ) {
        onSubmit(transformedValues, submitType);
        return;
      }

      onSubmit(transformedValues, initialValues ? 'update' : submitType);
    },
    [
      activeCurrencyMap,
      feeCurrencyMap,
      swapCurrencyToMap,
      initialValues,
      onSubmit,
    ],
  );
  const onSubmitInternal = (
    values: TFormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TSubmitType = 'default',
  ) => {
    if (
      submitType === 'dryRun' ||
      submitType === 'dryRunPreview' ||
      submitType === 'delete'
    ) {
      resolveAndSubmit(values, submitType);
      return;
    }

    guardTransfer(() => resolveAndSubmit(values, submitType));
  };

  const onSubmitInternalDryRun = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), undefined, 'dryRun');
    }
  };

  const onSubmitInternalDryRunPreview = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), undefined, 'dryRunPreview');
    }
  };

  const onSubmitInternalAddToBatch = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getTransformedValues(), undefined, 'addToBatch');
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
    if (!isExternalChain(to)) {
      form.setFieldValue('from', to);
      form.setFieldValue('to', from);
    }
  };

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

  const isLocalTransfer = from === to;

  const onFeeAssetClear = () => {
    form.setFieldValue('feeAsset', DEFAULT_CURRENCY_ENTRY_BASE);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Paper p="xl" shadow="md">
      <TransferWarningModal
        opened={warningOpened}
        onClose={warningOnClose}
        onConfirm={warningOnConfirm}
      />
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
                      key={currencyKey + index}
                      form={form}
                      fieldPath={`currencies.${index}`}
                      fieldValue={currencies[index]}
                      showOverrideLocation={currencies.length === 1}
                      size={currencies.length > 1 ? 'xs' : 'sm'}
                      currencyOptions={activeCurrencyOptions}
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
            onClear={onFeeAssetClear}
          />

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            rightSection={<AddressTooltip />}
            required
            data-testid="input-recipient"
            {...form.getInputProps('recipient')}
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

          <SubmitWarningAlert />

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
                        onSubmitInternal(
                          form.getTransformedValues(),
                          undefined,
                          'delete',
                        )
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
