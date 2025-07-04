import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  Menu,
  Paper,
  Stack,
  TextInput,
  useComputedColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type {
  TAsset,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import {
  isNodeEvm,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import {
  IconArrowsExchange,
  IconChecks,
  IconChevronDown,
  IconCoin,
  IconCoinFilled,
  IconFileInfo,
  IconPlus,
  IconTransfer,
  IconTrash,
} from '@tabler/icons-react';
import type { FC } from 'react';
import { useEffect } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import {
  useAutoFillWalletAddress,
  useCurrencyOptions,
  useFeeCurrencyOptions,
  useWallet,
} from '../../hooks';
import type { TSubmitType } from '../../types';
import { isValidPolkadotAddress, isValidWalletAddress } from '../../utils';
import { CurrencySelection } from '../common/CurrencySelection';
import { FeeAssetSelection } from '../common/FeeAssetSelection';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type TCurrencyEntry = {
  currencyOptionId: string;
  customCurrency: string;
  amount: string;
  isCustomCurrency: boolean;
  customCurrencyType?:
    | 'id'
    | 'symbol'
    | 'multilocation'
    | 'overridenMultilocation';
  customCurrencySymbolSpecifier?:
    | 'auto'
    | 'native'
    | 'foreign'
    | 'foreignAbstract';
};

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
  to: TNodeWithRelayChains;
  currencies: TCurrencyEntry[];
  feeAsset: Omit<TCurrencyEntry, 'amount'>;
  address: string;
  ahAddress: string;
  useApi: boolean;
};

export type TCurrencyEntryTransformed = TCurrencyEntry & { currency?: TAsset };

export type FormValuesTransformed = FormValues & {
  currencies: TCurrencyEntryTransformed[];
  transformedFeeAsset?: TCurrencyEntryTransformed;
};

type Props = {
  onSubmit: (values: FormValuesTransformed, submitType: TSubmitType) => void;
  loading: boolean;
  initialValues?: FormValues;
  isVisible?: boolean;
};

const XcmUtilsForm: FC<Props> = ({
  onSubmit,
  loading,
  initialValues,
  isVisible = true,
}) => {
  const form = useForm<FormValues>({
    initialValues: initialValues ?? {
      from: 'Astar',
      to: 'Hydration',
      currencies: [
        {
          currencyOptionId: '',
          customCurrency: '',
          amount: '10000000000000000000',
          isCustomCurrency: false,
          customCurrencyType: 'id',
          customCurrencySymbolSpecifier: 'auto',
        },
      ],
      feeAsset: {
        currencyOptionId: '',
        customCurrency: '',
        isCustomCurrency: false,
        customCurrencyType: 'id',
        customCurrencySymbolSpecifier: 'auto',
      },
      address: DEFAULT_ADDRESS,
      ahAddress: '',
      useApi: false,
    },

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

  const { from, to, currencies, useApi } = form.getValues();

  const { currencyOptions, currencyMap, isNotParaToPara } = useCurrencyOptions(
    from,
    to,
  );

  const { currencyOptions: feeCurrencyOptions, currencyMap: feeCurrencyMap } =
    useFeeCurrencyOptions(from);

  const transformCurrency = (
    entry: TCurrencyEntry,
    currencyMap: Record<string, TAsset>,
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
    const transformedCurrencies = values.currencies.map((entry) =>
      transformCurrency(entry, currencyMap),
    );

    const transformedFeeAsset =
      values.feeAsset.currencyOptionId || values.feeAsset.isCustomCurrency
        ? transformCurrency(values.feeAsset as TCurrencyEntry, feeCurrencyMap)
        : undefined;

    const transformedValues: FormValuesTransformed = {
      ...values,
      currencies: transformedCurrencies,
      transformedFeeAsset,
    };
    onSubmit(transformedValues, submitType);
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

  const onSubmitVerifyEdOnDestination = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'verifyEdOnDestination');
    }
  };

  const onSubmitGetTransferInfo = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), 'getTransferInfo');
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
      form.setFieldValue('from', currentTo as TNodeDotKsmWithRelayChains);
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

  const showAhAddress = isNodeEvm(from) && isNodeEvm(to);

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
            data={NODES_WITH_RELAY_CHAINS_DOT_KSM}
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
            data={NODES_WITH_RELAY_CHAINS}
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
                      placeholder="0"
                      size={currencies.length > 1 ? 'xs' : 'sm'}
                      required
                      data-testid={`input-amount-${index}`}
                      {...form.getInputProps(`currencies.${index}.amount`)}
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

          {selectedAccount ? (
            <Menu shadow="md" width={250} position="bottom-end">
              <Menu.Target>
                <Button
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
                  leftSection={<IconArrowsExchange size={16} />}
                  onClick={onSubmitGetTransferableAmount}
                >
                  Get Transferable Amount
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconChecks size={16} />}
                  onClick={onSubmitVerifyEdOnDestination}
                >
                  Verify ED on Destination
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconFileInfo size={16} />}
                  onClick={onSubmitGetTransferInfo}
                >
                  Get Transfer Info
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
