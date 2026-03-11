import {
  Button,
  Center,
  Group,
  Menu,
  MultiSelect,
  Paper,
  rem,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TCurrencyInput, TExchangeInput } from '@paraspell/sdk';
import {
  CHAINS,
  SUBSTRATE_CHAINS,
  type TChain,
  type TSubstrateChain,
} from '@paraspell/sdk';
import type { TExchangeChain } from '@paraspell/swap';
import { EXCHANGE_CHAINS } from '@paraspell/swap';
import {
  Icon123,
  IconArrowBarDown,
  IconArrowBarUp,
  IconChevronDown,
  IconCoinFilled,
  IconInfoCircle,
  IconLocationCheck,
} from '@tabler/icons-react';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import type { PolkadotSigner } from 'polkadot-api';
import type { FC, FormEvent } from 'react';
import { useEffect } from 'react';

import {
  DEFAULT_ADDRESS,
  DEFAULT_CURRENCY_ENTRY_BASE,
  MAIN_FORM_NAME,
} from '../../constants';
import { useEvmWallet, useRouterCurrencyOptions, useWallet } from '../../hooks';
import {
  advancedOptionsParsers,
  FeeAssetSchema,
  parseAsWalletAddress,
} from '../../parsers';
import type {
  TAdvancedOptions,
  TCurrencyEntryBase,
  TRouterSubmitType,
} from '../../types';
import {
  determineCurrency,
  determineFeeAsset,
  isValidWalletAddress,
  resolveCurrencyAsset,
  validateCustomEndpoint,
} from '../../utils';
import { resolveExchange } from '../../utils';
import { AccountSelectModal } from '../AccountSelectModal/AccountSelectModal';
import { AdvancedOptions } from '../AdvancedOptions';
import { CurrencySelection } from '../common/CurrencySelection';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { AmountTooltip } from '../Tooltip';
import { PolkadotWalletSelectModal } from '../WalletSelectModal/WalletSelectModal';

export type TRouterFormValues = {
  from?: TSubstrateChain;
  exchange?: TExchangeChain[];
  to?: TChain;
  currencyFrom: TCurrencyEntryBase;
  currencyTo: TCurrencyEntryBase;
  feeAsset: TCurrencyEntryBase;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  useApi: boolean;
  evmSigner?: PolkadotSigner;
  evmInjectorAddress?: string;
} & TAdvancedOptions;

export type TRouterFormValuesTransformed = Omit<
  TRouterFormValues,
  'exchange' | 'currencyFrom' | 'currencyTo' | 'feeAsset'
> & {
  exchange: TExchangeInput;
  currencyFrom: TCurrencyInput;
  currencyTo: TCurrencyInput;
  feeAsset?: TCurrencyInput;
};

type Props = {
  onSubmit: (
    values: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void;
  loading: boolean;
};

export const XcmRouterForm: FC<Props> = ({ onSubmit, loading }) => {
  const {
    connectWallet,
    selectedAccount: selectedAccountPolkadot,
    isInitialized,
    isLoadingExtensions,
    setSourceChainForLedger,
  } = useWallet();

  const {
    extensions,
    injectedExtension,
    accounts,
    selectedAccount,
    walletSelectModalOpened,
    accountsModalOpened,
    closeWalletSelectModal,
    closeAccountsModal,
    onConnectEvmWallet,
    onProviderSelect,
    onAccountSelect,
    onAccountDisconnect: onEvmAccountDisconnect,
  } = useEvmWallet();

  useEffect(() => {
    if (!selectedAccount || !injectedExtension) return;

    const account = injectedExtension
      ?.getAccounts()
      .find((account) => account.address === selectedAccount.address);
    if (!account) {
      throw new Error('No selected account');
    }

    form.setFieldValue('evmSigner', account.polkadotSigner);
    form.setFieldValue('evmInjectorAddress', selectedAccount.address);
  }, [selectedAccount, injectedExtension]);

  const [queryState, setQueryState] = useQueryStates({
    from: parseAsStringLiteral(SUBSTRATE_CHAINS).withDefault('Astar'),
    exchange: parseAsArrayOf(parseAsStringLiteral(EXCHANGE_CHAINS)).withDefault(
      [],
    ),
    to: parseAsStringLiteral(CHAINS).withDefault('Hydration'),
    currencyFrom: parseAsJson(FeeAssetSchema).withDefault(
      DEFAULT_CURRENCY_ENTRY_BASE,
    ),
    currencyTo: parseAsJson(FeeAssetSchema).withDefault(
      DEFAULT_CURRENCY_ENTRY_BASE,
    ),
    feeAsset: parseAsJson(FeeAssetSchema).withDefault(
      DEFAULT_CURRENCY_ENTRY_BASE,
    ),
    amount: parseAsString.withDefault('10'),
    recipientAddress: parseAsWalletAddress.withDefault(
      selectedAccount?.address ?? DEFAULT_ADDRESS,
    ),
    slippagePct: parseAsString.withDefault('1'),
    useApi: parseAsBoolean.withDefault(false),
    ...advancedOptionsParsers,
  });

  const form = useForm<TRouterFormValues>({
    name: MAIN_FORM_NAME,
    initialValues: queryState,
    validate: {
      recipientAddress: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      currencyFrom: (value) => {
        if (value.isCustomCurrency) {
          return value.customCurrency
            ? null
            : 'Custom currency input is required';
        }
        return value.currencyOptionId
          ? null
          : 'Currency from selection is required';
      },
      currencyTo: (value) => {
        if (value.isCustomCurrency) {
          return value.customCurrency
            ? null
            : 'Custom currency input is required';
        }
        return value.currencyOptionId
          ? null
          : 'Currency to selection is required';
      },
      exchange: (value, values) => {
        if (value === undefined && !values.from) {
          return 'Origin must be set to use Auto select';
        }
        return null;
      },
      amount: (value) => {
        return Number(value) > 0 ? null : 'Amount must be greater than 0';
      },
      apiOverrides: {
        endpoints: { url: validateCustomEndpoint },
      },
    },
    validateInputOnChange: ['exchange'],
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  useEffect(() => {
    setSourceChainForLedger(form.values.from);
  }, [form.values.from, setSourceChainForLedger]);

  const { from, to, exchange } = form.getValues();
  const isFeeAssetDisabled =
    from === 'Hydration' ||
    (!from && exchange?.[0] === 'HydrationDex' && exchange.length === 1);

  const onConnectWalletClick = () => void connectWallet();

  const onAccountDisconnect = () => {
    onEvmAccountDisconnect();
    form.setFieldValue('evmSigner', undefined);
    form.setFieldValue('evmInjectorAddress', undefined);
  };

  const { currencyFrom, currencyTo, feeAsset } = form.getValues();

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    feeCurrencyOptions,
    feeCurrencyMap,
    isFromNotParaToPara,
    isToNotParaToPara,
    adjacency,
  } = useRouterCurrencyOptions(
    from,
    resolveExchange(exchange),
    to,
    currencyFrom.currencyOptionId,
    currencyTo.currencyOptionId,
  );

  useEffect(() => {
    if (!currencyFrom.currencyOptionId || !currencyTo.currencyOptionId) return;

    const fromAsset = currencyFromMap[currencyFrom.currencyOptionId];
    const toAsset = currencyToMap[currencyTo.currencyOptionId];

    if (!fromAsset || !toAsset) return;

    const fromKey = JSON.stringify(fromAsset.location);
    const toKey = JSON.stringify(toAsset.location);

    if (fromKey && toKey && !adjacency.get(fromKey)?.has(toKey)) {
      form.setFieldValue('currencyTo', DEFAULT_CURRENCY_ENTRY_BASE);
    }
  }, [
    currencyFrom.currencyOptionId,
    currencyTo.currencyOptionId,
    currencyFromMap,
    currencyToMap,
    adjacency,
    form,
  ]);

  useEffect(() => {
    if (
      currencyFrom.currencyOptionId &&
      !currencyFromMap[currencyFrom.currencyOptionId]
    ) {
      form.setFieldValue('currencyFrom', DEFAULT_CURRENCY_ENTRY_BASE);
      form.setFieldValue('currencyTo', DEFAULT_CURRENCY_ENTRY_BASE);
    }
    if (
      currencyTo.currencyOptionId &&
      !currencyToMap[currencyTo.currencyOptionId]
    ) {
      form.setFieldValue('currencyTo', DEFAULT_CURRENCY_ENTRY_BASE);
    }
    if (
      feeAsset.currencyOptionId &&
      !feeCurrencyMap[feeAsset.currencyOptionId]
    ) {
      form.setFieldValue('feeAsset', DEFAULT_CURRENCY_ENTRY_BASE);
    }
  }, [
    currencyFromMap,
    currencyToMap,
    feeCurrencyMap,
    currencyFrom.currencyOptionId,
    currencyTo.currencyOptionId,
    form,
  ]);

  const onSubmitInternal = (
    values: TRouterFormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TRouterSubmitType = 'default',
  ) => {
    const resolvedFrom = resolveCurrencyAsset(
      values.currencyFrom,
      currencyFromMap,
    );
    const resolvedTo = resolveCurrencyAsset(values.currencyTo, currencyToMap);

    if (!resolvedFrom.currency && !resolvedFrom.isCustomCurrency) return;
    if (!resolvedTo.currency && !resolvedTo.isCustomCurrency) return;

    const resolvedFeeAsset =
      values.feeAsset.currencyOptionId || values.feeAsset.isCustomCurrency
        ? resolveCurrencyAsset(values.feeAsset, feeCurrencyMap)
        : undefined;

    const transformedValues: TRouterFormValuesTransformed = {
      ...values,
      exchange: resolveExchange(values.exchange),
      currencyFrom: determineCurrency(resolvedFrom),
      currencyTo: determineCurrency(resolvedTo),
      feeAsset: determineFeeAsset(resolvedFeeAsset),
    };

    onSubmit(transformedValues, submitType);
  };

  const infoEvmWallet = (
    <Tooltip
      label="You need to connect your Polkadot EVM wallet when choosing EVM chain as origin"
      position="top-end"
      withArrow
      transitionProps={{ transition: 'pop-bottom-right' }}
    >
      <Text component="div" style={{ cursor: 'help' }}>
        <Center>
          <IconInfoCircle
            style={{ width: rem(18), height: rem(18) }}
            stroke={1.5}
          />
        </Center>
      </Text>
    </Tooltip>
  );

  useEffect(() => {
    form.validateField('exchange');
  }, [form.values.from]);

  useEffect(() => {
    if (isFromNotParaToPara) {
      form.setFieldValue(
        'currencyFrom.currencyOptionId',
        Object.keys(currencyFromMap)[0],
      );
    }
  }, [isFromNotParaToPara, currencyFromMap]);

  useEffect(() => {
    if (isToNotParaToPara) {
      form.setFieldValue(
        'currencyTo.currencyOptionId',
        Object.keys(currencyToMap)[0],
      );
    }
  }, [isToNotParaToPara, currencyToMap]);

  const onSubmitInternalBestAmount = () => {
    const results = [
      form.validateField('from'),
      form.validateField('exchange'),
      form.validateField('to'),
      form.validateField('currencyFrom.currencyOptionId'),
      form.validateField('currencyTo.currencyOptionId'),
      form.validateField('amount'),
    ];
    const isValid = results.every((result) => !result.hasError);
    if (isValid) {
      onSubmitInternal(form.getValues(), undefined, 'getBestAmountOut');
    }
  };

  const onSubmitGetXcmFee = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getXcmFee');
    }
  };

  const onSubmitGetTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getTransferableAmount');
    }
  };

  const onSubmitGetMinTransferableAmount = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'getMinTransferableAmount');
    }
  };

  const onSubmitDryRun = () => {
    form.validate();
    if (form.isValid()) {
      onSubmitInternal(form.getValues(), undefined, 'dryRun');
    }
  };

  const onClearCurrencies = () => {
    form.setFieldValue('currencyFrom', DEFAULT_CURRENCY_ENTRY_BASE);
    form.setFieldValue('currencyTo', DEFAULT_CURRENCY_ENTRY_BASE);
  };

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <PolkadotWalletSelectModal
            isOpen={walletSelectModalOpened}
            onClose={closeWalletSelectModal}
            providers={extensions}
            onProviderSelect={onProviderSelect}
          />

          <AccountSelectModal
            isOpen={accountsModalOpened}
            onClose={closeAccountsModal}
            accounts={accounts}
            onAccountSelect={onAccountSelect}
            title="Select EVM account"
            onDisconnect={onAccountDisconnect}
          />

          <ParachainSelect
            label="Origin"
            placeholder="Pick value"
            description="Select the chain you're sending from"
            data={SUBSTRATE_CHAINS}
            allowDeselect={true}
            required={false}
            clearable
            data-testid="select-from"
            {...form.getInputProps('from')}
          />

          <MultiSelect
            label="Exchange"
            placeholder={exchange?.length ? 'Pick value' : 'Auto select'}
            data={EXCHANGE_CHAINS}
            searchable
            clearable
            required
            withAsterisk={false}
            data-testid="select-exchange"
            description="Select the chain where the asset swap will take place"
            {...form.getInputProps('exchange')}
          />

          <ParachainSelect
            label="Destination"
            placeholder="Pick value"
            data={CHAINS}
            data-testid="select-to"
            description="Select the chain that will receive the swapped assets"
            allowDeselect={true}
            required={false}
            clearable
            {...form.getInputProps('to')}
          />

          <CurrencySelection
            key={`${from}${exchange?.toString()}${to}currencyFrom`}
            form={form}
            fieldPath="currencyFrom"
            label="Currency From"
            fieldValue={form.values.currencyFrom}
            currencyOptions={currencyFromOptions}
            disabled={isFromNotParaToPara}
            required
            onClear={onClearCurrencies}
          />

          <CurrencySelection
            key={`${from}${exchange?.toString()}${to}${currencyFrom.currencyOptionId}currencyTo`}
            form={form}
            fieldPath="currencyTo"
            label="Currency To"
            fieldValue={form.values.currencyTo}
            currencyOptions={currencyToOptions}
            disabled={isToNotParaToPara}
            required
          />

          <CurrencySelection
            key={`${from}feeAsset`}
            form={form}
            fieldPath="feeAsset"
            label="Fee asset"
            description="Asset used to pay XCM fees (optional)"
            fieldValue={form.values.feeAsset}
            currencyOptions={feeCurrencyOptions}
            disabled={isFeeAssetDisabled}
          />

          <TextInput
            label="Recipient address"
            description="SS58 or Ethereum address"
            placeholder="Enter address"
            required
            data-testid="input-recipient-address"
            {...form.getInputProps('recipientAddress')}
          />

          <TextInput
            label="Amount"
            placeholder="0"
            flex={1}
            required
            rightSection={<AmountTooltip />}
            data-testid="input-amount"
            {...form.getInputProps('amount')}
          />

          <TextInput
            label="Slippage percentage (%)"
            placeholder="1"
            required
            data-testid="input-slippage-pct"
            {...form.getInputProps('slippagePct')}
          />

          <Group justify="space-between">
            <XcmApiCheckbox
              {...form.getInputProps('useApi', { type: 'checkbox' })}
            />

            <Button.Group orientation="vertical">
              <Button
                size="xs"
                variant="outline"
                onClick={onConnectEvmWallet}
                rightSection={infoEvmWallet}
                data-testid="connect-evm-wallet"
              >
                {selectedAccount
                  ? `${selectedAccount?.meta.name} (${selectedAccount?.meta.source})`
                  : 'Connect EVM wallet'}
              </Button>
            </Button.Group>
          </Group>

          <AdvancedOptions
            form={form}
            hideVersionAndPallet
            hideLocalAccount
            hideXcmFormatCheck
          />

          {selectedAccountPolkadot ? (
            <Button.Group>
              <Button
                type="submit"
                loading={loading}
                flex={1}
                data-testid="submit"
              >
                Submit transaction
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
                    leftSection={<Icon123 size={16} />}
                    onClick={onSubmitInternalBestAmount}
                  >
                    Get best amount out
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconCoinFilled size={16} />}
                    onClick={onSubmitGetXcmFee}
                  >
                    Get XCM fees
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconArrowBarDown size={16} />}
                    onClick={onSubmitGetMinTransferableAmount}
                  >
                    Get min transferable amount
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconArrowBarUp size={16} />}
                    onClick={onSubmitGetTransferableAmount}
                  >
                    Get transferable amount
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconLocationCheck size={16} />}
                    onClick={onSubmitDryRun}
                  >
                    Dry run
                  </Menu.Item>
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
