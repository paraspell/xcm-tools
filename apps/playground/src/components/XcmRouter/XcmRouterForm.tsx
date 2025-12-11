import {
  Button,
  Center,
  Group,
  Menu,
  MultiSelect,
  Paper,
  rem,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  CHAINS,
  SUBSTRATE_CHAINS,
  type TAssetInfo,
  type TChain,
  type TSubstrateChain,
} from '@paraspell/sdk';
import type { TExchangeChain, TExchangeInput } from '@paraspell/xcm-router';
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router';
import {
  Icon123,
  IconArrowBarDown,
  IconArrowBarUp,
  IconChevronDown,
  IconCoinFilled,
  IconInfoCircle,
  IconLocationCheck,
} from '@tabler/icons-react';
import { ethers } from 'ethers';
import {
  parseAsBoolean,
  parseAsNativeArrayOf,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import type { PolkadotSigner } from 'polkadot-api';
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
} from 'polkadot-api/pjs-signer';
import type { FC, FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { DEFAULT_ADDRESS } from '../../constants';
import {
  useAutoFillWalletAddress,
  useRouterCurrencyOptions,
  useWallet,
} from '../../hooks';
import type { TRouterSubmitType, TWalletAccount } from '../../types';
import { isValidWalletAddress } from '../../utils';
import { showErrorNotification } from '../../utils/notifications';
import {
  parseAsChain,
  parseAsExchangeChain,
  parseAsRecipientAddress,
  parseAsSubstrateChain,
} from '../../utils/routes/parsers';
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import {
  AdvancedOptionsAccordion,
  type AdvancedRouterOptions,
  validateEndpoint,
} from '../AdvancedOptionsAccordion/AdvancedOptionsAccordion';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { CurrencyInfo } from '../CurrencyInfo';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import WalletSelectModal from '../WalletSelectModal/WalletSelectModal';

export type TRouterFormValues = {
  from?: TSubstrateChain;
  exchange?: TExchangeChain[];
  to?: TChain;
  currencyFromOptionId: string;
  currencyToOptionId: string;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  useApi: boolean;
  evmSigner?: PolkadotSigner;
  evmInjectorAddress?: string;
} & AdvancedRouterOptions;

export type TRouterFormValuesTransformed = Omit<
  TRouterFormValues,
  'exchange'
> & {
  exchange: TExchangeChain;
  currencyFrom: TAssetInfo;
  currencyTo: TAssetInfo;
};

type Props = {
  onSubmit: (
    values: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void;
  loading: boolean;
  advancedOptions?: AdvancedRouterOptions;
  onAdvancedOptionsChange?: (options: AdvancedRouterOptions) => void;
};

export const XcmRouterForm: FC<Props> = ({
  onSubmit,
  loading,
  advancedOptions,
  onAdvancedOptionsChange,
}) => {
  const [
    walletSelectModalOpened,
    { open: openWalletSelectModal, close: closeWalletSelectModal },
  ] = useDisclosure(false);
  const [
    accountsModalOpened,
    { open: openAccountsModal, close: closeAccountsModal },
  ] = useDisclosure(false);

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount>();

  const onAccountSelect = (account: TWalletAccount) => {
    setSelectedAccount(account);
    closeAccountsModal();
  };

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
    from: parseAsSubstrateChain.withDefault('Astar'),
    exchange: parseAsNativeArrayOf(parseAsExchangeChain),
    to: parseAsChain.withDefault('Hydration'),
    currencyFromOptionId: parseAsString.withDefault(''),
    currencyToOptionId: parseAsString.withDefault(''),
    amount: parseAsString.withDefault('10'),
    recipientAddress: parseAsRecipientAddress.withDefault(DEFAULT_ADDRESS),
    slippagePct: parseAsString.withDefault(''),
    useApi: parseAsBoolean.withDefault(false),
  });

  const form = useForm<TRouterFormValues>({
    initialValues: { ...queryState, ...advancedOptions },

    validate: {
      recipientAddress: (value) =>
        isValidWalletAddress(value) ? null : 'Invalid address',
      currencyFromOptionId: (value) => {
        return value ? null : 'Currency from selection is required';
      },
      currencyToOptionId: (value) => {
        return value ? null : 'Currency to selection is required';
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
      customEndpoints: {
        endpoints: {
          value: (value) => {
            return validateEndpoint(value) ? null : 'Endpoint is not valid';
          },
        },
      },
    },
    validateInputOnChange: ['exchange'],
  });

  useAutoFillWalletAddress(form, 'recipientAddress');

  useEffect(() => {
    const { isDevelopment, abstractDecimals, customEndpoints, ...restValues } =
      form.values;
    void setQueryState(restValues);
  }, [form.values, setQueryState]);

  useEffect(() => {
    const { isDevelopment, abstractDecimals, customEndpoints } = form.values;
    void onAdvancedOptionsChange?.({
      isDevelopment,
      abstractDecimals,
      customEndpoints,
    });
  }, [
    form.values.isDevelopment,
    form.values.abstractDecimals,
    form.values.customEndpoints,
  ]);

  const { from, to, exchange } = form.getValues();

  const initEvmExtensions = () => {
    const ext = getInjectedExtensions();
    if (!ext.length) {
      showErrorNotification('No wallet extension found, install it to connect');
      return;
    }
    setExtensions(ext);
    openWalletSelectModal();
  };

  const onConnectEvmWallet = () => {
    try {
      initEvmExtensions();
    } catch (_e) {
      showErrorNotification('Failed to connect EVM wallet');
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const onAccountDisconnect = () => {
    setSelectedAccount(undefined);
    form.setFieldValue('evmSigner', undefined);
    form.setFieldValue('evmInjectorAddress', undefined);
    closeAccountsModal();
  };

  const selectProvider = async (walletName: string) => {
    try {
      const extension = await connectInjectedExtension(walletName);
      setInjectedExtension(extension);

      const allAccounts = extension.getAccounts();
      const evmAccounts = allAccounts.filter((acc) =>
        ethers.isAddress(acc.address),
      );
      if (!evmAccounts.length) {
        showErrorNotification('No EVM accounts found in the selected wallet');
        return;
      }

      setAccounts(
        evmAccounts.map((acc) => ({
          address: acc.address,
          meta: {
            name: acc.name,
            source: extension.name,
          },
        })),
      );

      closeWalletSelectModal();
      openAccountsModal();
    } catch (_e) {
      showErrorNotification('Failed to connect to wallet');
    }
  };

  const onProviderSelect = (walletName: string) => {
    void selectProvider(walletName);
  };

  const getExchange = (exchange: TExchangeChain[] | undefined) => {
    if (Array.isArray(exchange)) {
      if (exchange.length === 1) {
        return exchange[0];
      }

      if (exchange.length === 0) {
        return undefined;
      }
    }

    return exchange;
  };

  const { currencyFromOptionId, currencyToOptionId } = form.values;

  const {
    currencyFromOptions,
    currencyFromMap,
    currencyToOptions,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
    adjacency,
  } = useRouterCurrencyOptions(
    from,
    getExchange(exchange) as TExchangeInput,
    to,
    currencyFromOptionId,
    currencyToOptionId,
  );

  const pairKey = (asset?: { location?: object; symbol?: string }) =>
    asset?.location ? JSON.stringify(asset.location) : asset?.symbol;

  useEffect(() => {
    if (!currencyFromOptionId || !currencyToOptionId) return;

    const fromAsset = currencyFromMap[currencyFromOptionId];
    const toAsset = currencyToMap[currencyToOptionId];

    const fromKey = pairKey(fromAsset);
    const toKey = pairKey(toAsset);

    if (fromKey && toKey && !adjacency.get(fromKey)?.has(toKey)) {
      form.setFieldValue('currencyToOptionId', '');
    }
  }, [
    currencyFromOptionId,
    currencyToOptionId,
    currencyFromMap,
    currencyToMap,
    adjacency,
    form,
  ]);

  useEffect(() => {
    if (currencyFromOptionId && !currencyFromMap[currencyFromOptionId]) {
      form.setFieldValue('currencyFromOptionId', '');
      form.setFieldValue('currencyToOptionId', '');
    }
    if (currencyToOptionId && !currencyToMap[currencyToOptionId]) {
      form.setFieldValue('currencyToOptionId', '');
    }
  }, [
    currencyFromMap,
    currencyToMap,
    currencyFromOptionId,
    currencyToOptionId,
    form,
  ]);

  const onSubmitInternal = (
    values: TRouterFormValues,
    _event: FormEvent<HTMLFormElement> | undefined,
    submitType: TRouterSubmitType = 'default',
  ) => {
    const currencyFrom = currencyFromMap[values.currencyFromOptionId];
    const currencyTo = currencyToMap[values.currencyToOptionId];

    if (!currencyFrom || !currencyTo) {
      return;
    }

    const transformedValues = {
      ...values,
      exchange: getExchange(values.exchange) as TExchangeChain,
      currencyFrom,
      currencyTo: currencyTo as TAssetInfo,
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
        'currencyFromOptionId',
        Object.keys(currencyFromMap)[0],
      );
    }
  }, [isFromNotParaToPara, currencyFromMap]);

  useEffect(() => {
    if (isToNotParaToPara) {
      form.setFieldValue('currencyToOptionId', Object.keys(currencyToMap)[0]);
    }
  }, [isToNotParaToPara, currencyToMap]);

  const {
    connectWallet,
    selectedAccount: selectedAccountPolkadot,
    isInitialized,
    isLoadingExtensions,
  } = useWallet();

  const onSubmitInternalBestAmount = () => {
    const results = [
      form.validateField('from'),
      form.validateField('exchange'),
      form.validateField('to'),
      form.validateField('currencyFromOptionId'),
      form.validateField('currencyToOptionId'),
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

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmitInternal)}>
        <Stack gap="lg">
          <WalletSelectModal
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

          <Select
            key={`${from?.toString()}${exchange?.toString()}${to?.toString()}currencyFrom`}
            label="Currency From"
            placeholder="Pick value"
            data={currencyFromOptions}
            allowDeselect={false}
            disabled={isFromNotParaToPara}
            searchable
            required
            clearable
            data-testid="select-currency-from"
            {...form.getInputProps('currencyFromOptionId')}
            onClear={() => {
              form.setFieldValue('currencyFromOptionId', '');
              form.setFieldValue('currencyToOptionId', '');
            }}
          />

          <Select
            key={`${from?.toString()}${exchange?.toString()}${to?.toString()}${currencyFromOptionId}currencyTo`}
            label="Currency To"
            placeholder="Pick value"
            data={currencyToOptions}
            allowDeselect={false}
            disabled={isToNotParaToPara}
            searchable
            required
            data-testid="select-currency-to"
            {...form.getInputProps('currencyToOptionId')}
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
            rightSection={<CurrencyInfo />}
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

          <AdvancedOptionsAccordion form={form} isRouter />

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
