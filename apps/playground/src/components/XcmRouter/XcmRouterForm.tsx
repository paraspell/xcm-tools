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
import type {
  TAsset,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import { NODES_WITH_RELAY_CHAINS } from '@paraspell/sdk';
import type { TExchangeInput, TExchangeNode } from '@paraspell/xcm-router';
import { EXCHANGE_NODES } from '@paraspell/xcm-router';
import {
  Icon123,
  IconChevronDown,
  IconCoinFilled,
  IconInfoCircle,
} from '@tabler/icons-react';
import { ethers } from 'ethers';
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
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import WalletSelectModal from '../WalletSelectModal/WalletSelectModal';

export type TRouterFormValues = {
  from?: TNodeDotKsmWithRelayChains;
  exchange?: TExchangeNode[];
  to?: TNodeWithRelayChains;
  currencyFromOptionId: string;
  currencyToOptionId: string;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  useApi: boolean;
  evmSigner?: PolkadotSigner;
  evmInjectorAddress?: string;
};

export type TRouterFormValuesTransformed = Omit<
  TRouterFormValues,
  'exchange'
> & {
  exchange: TExchangeNode;
  currencyFrom: TAsset;
  currencyTo: TAsset;
};

type Props = {
  onSubmit: (
    values: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType,
  ) => void;
  loading: boolean;
};

export const XcmRouterForm: FC<Props> = ({ onSubmit, loading }) => {
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

  const form = useForm<TRouterFormValues>({
    initialValues: {
      from: 'Astar',
      exchange: undefined,
      to: 'Hydration',
      currencyFromOptionId: '',
      currencyToOptionId: '',
      amount: '10000000000000000000',
      recipientAddress: DEFAULT_ADDRESS,
      slippagePct: '1',
      useApi: false,
    },

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
    },
    validateInputOnChange: ['exchange'],
  });

  useAutoFillWalletAddress(form, 'recipientAddress');

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

  const getExchange = (exchange: TExchangeNode[] | undefined) => {
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

  const pairKey = (asset?: { multiLocation?: object; symbol?: string }) =>
    asset?.multiLocation ? JSON.stringify(asset.multiLocation) : asset?.symbol;

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
      exchange: getExchange(values.exchange) as TExchangeNode,
      currencyFrom,
      currencyTo: currencyTo as TAsset,
    };

    onSubmit(transformedValues, submitType);
  };

  const infoEvmWallet = (
    <Tooltip
      label="You need to connect yout Polkadot EVM wallet when choosing EVM chain as origin"
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
            data={NODES_WITH_RELAY_CHAINS}
            allowDeselect={true}
            required={false}
            clearable
            data-testid="select-from"
            {...form.getInputProps('from')}
          />

          <MultiSelect
            label="Exchange"
            placeholder={exchange?.length ? 'Pick value' : 'Auto select'}
            data={EXCHANGE_NODES}
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
            data={[...NODES_WITH_RELAY_CHAINS]}
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
            required
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
